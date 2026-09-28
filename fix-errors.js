const fs = require('fs');

// Fix 1: project-card.tsx — FUNDING -> FUNDRAISING
{
  const f = 'src/components/shared/project-card.tsx';
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace('{status === "FUNDING" && (', '{status === "FUNDRAISING" && (');
  fs.writeFileSync(f, c, 'utf8');
  console.log('project-card fixed:', fs.readFileSync(f,'utf8').includes('"FUNDRAISING"'));
}

// Fix 2: admin project detail page — Decimal.toString()
{
  const f = 'src/app/(admin)/admin/projects/[id]/page.tsx';
  let c = fs.readFileSync(f, 'utf8');
  // fundingPct(project.fundedAmountBdt, project.fundingGoalBdt)
  c = c.replace(
    'fundingPct(project.fundedAmountBdt, project.fundingGoalBdt)',
    'fundingPct(project.fundedAmountBdt.toString(), project.fundingGoalBdt.toString())'
  );
  // formatBdt(project.fundingGoalBdt)
  c = c.replace(/formatBdt\(project\.fundingGoalBdt\)/g, 'formatBdt(project.fundingGoalBdt.toString())');
  c = c.replace(/formatBdt\(project\.fundedAmountBdt\)/g, 'formatBdt(project.fundedAmountBdt.toString())');
  c = c.replace(/formatBdt\(project\.minInvestmentBdt\)/g, 'formatBdt(project.minInvestmentBdt.toString())');
  fs.writeFileSync(f, c, 'utf8');
  console.log('admin detail fixed');
}

// Fix 3: admin projects list page — Decimal.toString()
{
  const f = 'src/app/(admin)/admin/projects/page.tsx';
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(
    'fundingPct(p.fundedAmountBdt, p.fundingGoalBdt)',
    'fundingPct(p.fundedAmountBdt.toString(), p.fundingGoalBdt.toString())'
  );
  c = c.replace(/formatBdt\(p\.fundingGoalBdt\)/g, 'formatBdt(p.fundingGoalBdt.toString())');
  fs.writeFileSync(f, c, 'utf8');
  console.log('admin list fixed');
}

// Fix 4: admin edit page — endDate missing from select
// The projectDetailSelect already includes endDate via spread — the issue is
// the select shape doesn't include endDate. Add it to projectDetailSelect.
{
  const f = 'src/db/repositories/project.repository.ts';
  let c = fs.readFileSync(f, 'utf8');
  // endDate is not in projectListSelect but should be in projectDetailSelect
  // It's already spread from projectListSelect which doesn't have it.
  // Add endDate to projectListSelect
  c = c.replace(
    '  startDate: true,\n  coverImageUrl: true,',
    '  startDate: true,\n  endDate: true,\n  coverImageUrl: true,'
  );
  fs.writeFileSync(f, c, 'utf8');
  console.log('repository endDate fixed');
}

console.log('All fixes applied');
