import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBtcData } from "./hooks/useBtcData";

const fmt = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmtCompact = (v: number) =>
  v >= 1000
    ? `$${(v / 1000).toFixed(1)}k`
    : fmt(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-bold">{fmt(payload[0].value)}</p>
    </div>
  );
};

export default function App() {
  const { data, loading, error, countdown, refetch } = useBtcData(60_000);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  if (loading && !data) {
    return (
      <div className="w-full h-full overflow-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="w-full h-[300px]" />
        <div className="flex gap-4">
          <Skeleton className="h-14 w-1/3" />
          <Skeleton className="h-14 w-1/3" />
          <Skeleton className="h-14 w-1/3" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-3 h-3 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.changePercent24h >= 0;
  const chartColor = isPositive ? "#34d399" : "#f87171";
  const priceRange = data.high24h - data.low24h;
  const domainMin = data.low24h - priceRange * 0.02;
  const domainMax = data.high24h + priceRange * 0.02;

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {fmt(data.currentPrice)}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono border-0",
                isPositive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {isPositive ? "+" : ""}
              {data.changePercent24h.toFixed(2)}%
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>
              Updated {data.lastUpdated.toLocaleTimeString()} · next in {countdown}s
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
          onClick={handleRefresh}
        >
          <RefreshCw
            className={cn("w-3.5 h-3.5", refreshing && "animate-spin")}
          />
        </Button>
      </div>

      {/* Chart */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.history}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmtCompact(v)}
              width={58}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={1.5}
              fill="url(#priceGrad)"
              dot={false}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "24h High", value: fmt(data.high24h), color: "text-emerald-400" },
          { label: "24h Low", value: fmt(data.low24h), color: "text-red-400" },
          {
            label: "24h Range",
            value: fmt(priceRange),
            color: "text-zinc-300",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900/60 border border-zinc-800 px-3 py-2"
          >
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={cn("text-sm font-bold mt-0.5", stat.color)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
