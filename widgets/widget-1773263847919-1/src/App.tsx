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

const TIMEFRAMES = [
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

function formatUsd(value: number, compact = false): string {
  if (compact) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs">
        <p className="text-zinc-400 mb-1">{label}</p>
        <p className="text-white font-bold text-sm">
          {formatUsd(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [selectedDays, setSelectedDays] = useState(1);
  const { data, loading, error, countdown, refresh } = useBtcData(selectedDays);

  const isPositive = data ? data.changePercent24h >= 0 : true;
  const chartColor = isPositive ? "#34d399" : "#f87171";

  // Thin out ticks for the X axis
  const tickCount = selectedDays <= 1 ? 8 : selectedDays <= 7 ? 7 : 6;
  const tickInterval = data?.history
    ? Math.max(Math.floor(data.history.length / tickCount), 1)
    : 10;

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Price Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          {loading && !data ? (
            <>
              <Skeleton className="h-9 w-48 bg-zinc-800" />
              <Skeleton className="h-5 w-32 bg-zinc-800" />
            </>
          ) : data ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white tracking-tight">
                  {formatUsd(data.currentPrice)}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-mono border-0 px-2 py-0.5",
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
              <p className="text-xs text-zinc-500">
                {isPositive ? "+" : ""}
                {formatUsd(data.change24h)} (24h)
              </p>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {countdown}s
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-white"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.days}
            onClick={() => setSelectedDays(tf.days)}
            className={cn(
              "px-3 py-1 text-xs font-medium transition-colors",
              selectedDays === tf.days
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-red-400 text-xs bg-red-500/10 px-3 py-2">
          {error} — will retry in {countdown}s
        </div>
      )}

      {/* Chart */}
      <div className="w-full" style={{ height: "calc(100% - 160px)", minHeight: 220 }}>
        {loading && !data ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full bg-zinc-800/50" />
          </div>
        ) : data?.history ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.history}
              margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "#71717a", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#71717a", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)
                }
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={1.5}
                fill="url(#priceGrad)"
                dot={false}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Stats Row */}
      {data && (
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: "24h High", value: formatUsd(data.high24h) },
            { label: "24h Low", value: formatUsd(data.low24h) },
            { label: "Market Cap", value: formatUsd(data.marketCap, true) },
            { label: "24h Volume", value: formatUsd(data.volume24h, true) },
          ].map((stat) => (
            <div key={stat.label} className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                {stat.label}
              </p>
              <p className="text-xs text-zinc-300 font-medium">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
