/**
 * Restores one hard-deleted project (and every row that was cascade-deleted
 * with it) from a Neon point-in-time branch back into the live database.
 *
 *   node scripts/restore-project.mjs <project-slug>           # dry run: report only
 *   node scripts/restore-project.mjs <project-slug> --apply   # copy rows back
 *
 * Needs RECOVERY_DATABASE_URL (the Neon recovery branch) and DATABASE_URL (live).
 * Rows that already exist in live are skipped; nothing else is modified, except
 * re-linking rows whose reference to the project was nulled (ON DELETE SET NULL).
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const [slug] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const rehearse = process.argv.includes("--rehearse"); // runs the inserts, then rolls back
const apply = process.argv.includes("--apply") || rehearse;
if (!slug) throw new Error("Usage: node scripts/restore-project.mjs <project-slug> [--apply]");
if (!process.env.RECOVERY_DATABASE_URL) throw new Error("RECOVERY_DATABASE_URL is not set");
if (process.env.RECOVERY_DATABASE_URL === process.env.DATABASE_URL) throw new Error("Recovery and live URLs are the same");

const src = new PrismaClient({ datasources: { db: { url: process.env.RECOVERY_DATABASE_URL } } });
const dst = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const q = (db, sql, ...args) => db.$queryRawUnsafe(sql, ...args);
const ident = (s) => `"${s.replace(/"/g, '""')}"`;

// ── Schema metadata (from the recovery branch) ────────────────────────────────
const fks = await q(src, `
  SELECT kcu.table_name AS child, kcu.column_name AS col, ccu.table_name AS parent, ccu.column_name AS pcol, rc.delete_rule AS rule
  FROM information_schema.referential_constraints rc
  JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = rc.constraint_name AND kcu.constraint_schema = rc.constraint_schema
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = rc.unique_constraint_name AND ccu.constraint_schema = rc.unique_constraint_schema
  WHERE rc.constraint_schema = 'public'`);
const pkRows = await q(src, `
  SELECT kcu.table_name AS t, kcu.column_name AS c
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public' ORDER BY kcu.ordinal_position`);
const pks = new Map();
for (const { t, c } of pkRows) pks.set(t, [...(pks.get(t) ?? []), c]);
const keyOf = (t, row) => (pks.get(t) ?? Object.keys(row)).map((c) => String(row[c])).join("|");

// ── Collect the project and everything that cascades from it ─────────────────
const [project] = await q(src, `SELECT * FROM "projects" WHERE slug = $1`, slug);
if (!project) throw new Error(`No project "${slug}" in the recovery branch — pick an earlier branch time`);
const [already] = await q(dst, `SELECT id FROM "projects" WHERE id::text = $1 OR slug = $2`, String(project.id), slug);
if (already && apply && !rehearse) throw new Error(`"${slug}" already exists in the live database`);
if (already) console.log(`(note: "${slug}" already exists in live — --apply would refuse)`);

const rows = new Map([["projects", new Map([[keyOf("projects", project), project]])]]);
const relinks = []; // SET NULL children: { table, col, value, key }
const queue = ["projects"];
while (queue.length) {
  const parent = queue.shift();
  for (const fk of fks.filter((f) => f.parent === parent)) {
    const values = [...rows.get(parent).values()].map((r) => String(r[fk.pcol]));
    if (!values.length) continue;
    const children = await q(src, `SELECT * FROM ${ident(fk.child)} WHERE ${ident(fk.col)}::text = ANY($1::text[])`, values);
    if (fk.rule === "CASCADE") {
      const bucket = rows.get(fk.child) ?? new Map();
      let added = false;
      for (const c of children) {
        const k = keyOf(fk.child, c);
        if (!bucket.has(k)) { bucket.set(k, c); added = true; }
      }
      rows.set(fk.child, bucket);
      if (added) queue.push(fk.child);
    } else if (fk.rule === "SET NULL") {
      for (const c of children) relinks.push({ table: fk.child, col: fk.col, value: c[fk.col], row: c });
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log(`Project: ${project.title} (${project.id}) — status ${project.status}${project.deletedAt ? ", hidden (deletedAt set)" : ""}`);
for (const [t, m] of rows) console.log(`  ${t.padEnd(36)} ${m.size} row(s)`);
if (relinks.length) console.log(`  + ${relinks.length} row(s) whose link to these records will be restored`);

// Parents outside the restored set must still exist in live.
const missing = [];
for (const [t, m] of rows) {
  for (const fk of fks.filter((f) => f.child === t && !rows.has(f.parent))) {
    const vals = [...new Set([...m.values()].map((r) => r[fk.col]).filter((v) => v != null).map(String))];
    if (!vals.length) continue;
    const found = await q(dst, `SELECT ${ident(fk.pcol)}::text AS v FROM ${ident(fk.parent)} WHERE ${ident(fk.pcol)}::text = ANY($1::text[])`, vals);
    const have = new Set(found.map((r) => r.v));
    for (const v of vals) if (!have.has(v)) missing.push(`${t}.${fk.col} → ${fk.parent}.${fk.pcol} = ${v}`);
  }
}
if (missing.length) {
  console.log("\nCannot restore: these referenced records no longer exist in live:");
  for (const m of missing) console.log("  " + m);
  console.log("Restore those first (or ask for them to be included).");
  await Promise.all([src.$disconnect(), dst.$disconnect()]);
  process.exit(1);
}

if (!apply) {
  console.log("\nDry run — nothing written. Re-run with --apply to restore.");
  await Promise.all([src.$disconnect(), dst.$disconnect()]);
  process.exit(0);
}

// ── Insert in dependency order (parents before children) ─────────────────────
const tables = [...rows.keys()];
const ordered = [];
const visit = (t, seen = new Set()) => {
  if (ordered.includes(t) || seen.has(t)) return;
  seen.add(t);
  for (const fk of fks.filter((f) => f.child === t && f.parent !== t && rows.has(f.parent))) visit(fk.parent, seen);
  ordered.push(t);
};
tables.forEach((t) => visit(t));

await dst.$transaction(async (tx) => {
  for (const t of ordered) {
    const data = JSON.stringify([...rows.get(t).values()], (_k, v) => (typeof v === "bigint" ? v.toString() : v));
    const n = await tx.$executeRawUnsafe(
      `INSERT INTO ${ident(t)} SELECT * FROM json_populate_recordset(NULL::${ident(t)}, $1::json) ON CONFLICT DO NOTHING`,
      data,
    );
    console.log(`  restored ${t.padEnd(36)} ${n}`);
  }
  for (const r of relinks) {
    const pk = pks.get(r.table) ?? [];
    const where = pk.map((c, i) => `${ident(c)}::text = $${i + 2}`).join(" AND ");
    // Cast through the table's row type so uuid/text columns both accept the value.
    const n = await tx.$executeRawUnsafe(
      `UPDATE ${ident(r.table)} SET ${ident(r.col)} = (json_populate_record(NULL::${ident(r.table)}, json_build_object($1::text, $2::text))).${ident(r.col)}
       WHERE ${where.replace(/\$(\d+)/g, (_m, i) => `$${Number(i) + 1}`)} AND ${ident(r.col)} IS NULL`,
      r.col, String(r.value), ...pk.map((c) => String(r.row[c])),
    );
    console.log(`  relinked ${r.table}.${r.col}`.padEnd(46) + ` ${n}`);
  }
  if (rehearse) throw new Error("REHEARSAL_ROLLBACK");
}, { timeout: 60_000 }).catch((e) => {
  if (e?.message !== "REHEARSAL_ROLLBACK") throw e;
  console.log("\nRehearsal OK — every statement ran, then everything was rolled back. Nothing written.");
  process.exit(0);
});

console.log("\nDone. Public pages are cached and pick it up within about 5 minutes.");
await Promise.all([src.$disconnect(), dst.$disconnect()]);
