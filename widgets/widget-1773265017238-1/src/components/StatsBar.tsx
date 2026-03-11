import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsBarProps {
  high: number | null;
  low: number | null;
  dataPoints: number;
  lastUpdated: Date | null;
  loading: boolean;
}

const formatPrice = (val: number | null) =>
  val != null
    ? `$${val.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";

export const StatsBar: React.FC<StatsBarProps> = ({
  high,
  low,
  dataPoints,
  lastUpdated,
  loading,
}) => {
  if (loading && high === null) {
    return (
      <div className="flex gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
    );
  }

  const stats = [
    { label: "Session High", value: formatPrice(high), color: "text-emerald-400" },
    { label: "Session Low", value: formatPrice(low), color: "text-red-400" },
    { label: "Data Points", value: dataPoints.toString(), color: "text-zinc-100" },
    {
      label: "Last Update",
      value: lastUpdated
        ? lastUpdated.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
        : "—",
      color: "text-zinc-100",
    },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            {stat.label}
          </span>
          <span className={`text-sm font-semibold tabular-nums ${stat.color}`}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
};
