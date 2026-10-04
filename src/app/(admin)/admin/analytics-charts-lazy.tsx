"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { AdminAnalyticsCharts as T } from "./analytics-charts";

const AdminAnalyticsChartsInner = dynamic(
  () => import("./analytics-charts").then((m) => m.AdminAnalyticsCharts),
  { ssr: false },
);

export function AdminAnalyticsCharts(props: ComponentProps<typeof T>) {
  return <AdminAnalyticsChartsInner {...props} />;
}
