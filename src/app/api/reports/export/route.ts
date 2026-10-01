import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import {
  streamInvestmentsForExport,
  streamProjectsForExport,
  streamInvestorPaymentsForExport,
  streamDistributionsForExport,
} from "@/server/data/report.data";
import {
  toCSV, toExcel,
  INVESTMENT_COLUMNS, PROJECT_COLUMNS, PAYMENT_COLUMNS, DISTRIBUTION_COLUMNS, INVESTOR_COLUMNS,
  mapInvestmentRows, mapProjectRows, mapPaymentRows, mapDistributionRows, mapInvestorRows,
} from "@/server/services/report.service";
import {
  getInvestorReport,
} from "@/server/data/report.data";
import type { ReportFilters } from "@/server/data/report.data";

// GET /api/reports/export?type=investments&format=csv&dateFrom=...&dateTo=...
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const sp      = request.nextUrl.searchParams;
  const type    = sp.get("type")    ?? "";
  const format  = sp.get("format")  ?? "csv"; // csv | excel

  const filters: ReportFilters = {
    dateFrom:   sp.get("dateFrom")   ?? undefined,
    dateTo:     sp.get("dateTo")     ?? undefined,
    projectId:  sp.get("projectId")  ?? undefined,
    investorId: sp.get("investorId") ?? undefined,
    status:     sp.get("status")     ?? undefined,
    category:   sp.get("category")   ?? undefined,
  };

  try {
    let csvData: string | null = null;
    let excelData: Buffer | null = null;
    let filename = "report";

    if (type === "investments") {
      const rows = mapInvestmentRows(await streamInvestmentsForExport(session, filters));
      filename = "investments";
      if (format === "excel") excelData = await toExcel("Investments", INVESTMENT_COLUMNS, rows);
      else csvData = toCSV(INVESTMENT_COLUMNS, rows);

    } else if (type === "projects") {
      const raw  = await streamProjectsForExport(session, filters);
      const rows = mapProjectRows(raw);
      filename = "projects";
      if (format === "excel") excelData = await toExcel("Projects", PROJECT_COLUMNS, rows);
      else csvData = toCSV(PROJECT_COLUMNS, rows);

    } else if (type === "payments") {
      const raw  = await streamInvestorPaymentsForExport(session, filters);
      const rows = mapPaymentRows(raw);
      filename = "transactions";
      if (format === "excel") excelData = await toExcel("Transactions", PAYMENT_COLUMNS, rows);
      else csvData = toCSV(PAYMENT_COLUMNS, rows);

    } else if (type === "distributions") {
      const raw  = await streamDistributionsForExport(session, filters);
      const rows = mapDistributionRows(raw);
      filename = "distributions";
      if (format === "excel") excelData = await toExcel("Distributions", DISTRIBUTION_COLUMNS, rows);
      else csvData = toCSV(DISTRIBUTION_COLUMNS, rows);

    } else if (type === "investors") {
      const data = await getInvestorReport(session, filters);
      const rows = mapInvestorRows(data.investors);
      filename = "investors";
      if (format === "excel") excelData = await toExcel("Investors", INVESTOR_COLUMNS, rows);
      else csvData = toCSV(INVESTOR_COLUMNS, rows);

    } else {
      return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
    }

    const date = new Date().toISOString().slice(0, 10);

    if (format === "excel" && excelData) {
      return new NextResponse(excelData, {
        headers: {
          "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}_${date}.xlsx"`,
          "Cache-Control":       "no-store",
        },
      });
    }

    return new NextResponse(csvData ?? "", {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}_${date}.csv"`,
        "Cache-Control":       "no-store",
      },
    });

  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[report export]", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
