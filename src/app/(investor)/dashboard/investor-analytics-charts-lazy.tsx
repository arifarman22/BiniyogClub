"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { InvestorAnalyticsCharts as T } from "./investor-analytics-charts";

const InvestorAnalyticsChartsInner = dynamic(
  () => import("./investor-analytics-charts").then((m) => m.InvestorAnalyticsCharts),
);

export function InvestorAnalyticsCharts(props: ComponentProps<typeof T>) {
  return <InvestorAnalyticsChartsInner {...props} />;
}
