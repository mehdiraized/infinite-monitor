import { useState, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBtcData } from "./hooks/useBtcData";

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-semibold text-sm">
        {formatUsd(payload[0].value)}
      </p>
    </div>
  );
}

export default function App() {
  const { data, loading, error, refetch } = useBtcData();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = useCallback(async () => {
    setSpinning(true);
    await refetch();
    setTimeout(() => setSpinning(false), 600);
  }, [refetch]);

  if (loading && !data) {
    return (
      <div className="w-full h-full overflow-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-[300px] w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-zinc-400 hover:text-white text-xs underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.changePercent24h >= 0;
  const accentColor = isPositive ? "#34d399" : "#f87171";
  const gradientId = "btcGradient";

  // Calculate Y domain with some padding
  const minPrice = data.low24h;
  const maxPrice = data.high24h;
  const padding = (maxPrice - minPrice) * 0.08;
  const yMin = Math.floor(minPrice - padding);
  const yMax = Math.ceil(maxPrice + padding);

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white tracking-tight">
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
                <TrendingUp className="w-3 h-3 mr-1 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 inline" />
              )}
              {isPositive ? "+" : ""}
              {data.changePercent24h.toFixed(2)}%
            </Badge>
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
            <span>
              24h: {formatUsd(data.change24h > 0 ? data.change24h : -data.change24h)}{" "}
              {isPositive ? "up" : "down"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {data.lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Refresh now"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", spinning && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: "calc(100% - 120px)", minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.prices}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
              }
              width={58}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={accentColor}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 3,
                stroke: accentColor,
                strokeWidth: 2,
                fill: "#18181b",
              }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-6 text-[11px] text-zinc-500">
        <span>
          H: <span className="text-zinc-300">{formatUsd(data.high24h)}</span>
        </span>
        <span>
          L: <span className="text-zinc-300">{formatUsd(data.low24h)}</span>
        </span>
        <span className="ml-auto opacity-60">updates every 60s</span>
      </div>
    </div>
  );
}
