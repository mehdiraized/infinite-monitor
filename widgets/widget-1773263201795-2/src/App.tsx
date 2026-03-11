
import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PricePoint {
  time: number;
  price: number;
  label: string;
}

const RANGES = [
  { key: "1", label: "24H", days: 1 },
  { key: "7", label: "7D", days: 7 },
  { key: "30", label: "30D", days: 30 },
  { key: "90", label: "90D", days: 90 },
];

export default function App() {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("1");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${range}`;
        const res = await fetch(
          "/api/proxy?url=" + encodeURIComponent(url)
        );
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();

        const points: PricePoint[] = json.prices.map(
          ([timestamp, price]: [number, number]) => {
            const d = new Date(timestamp);
            let label: string;
            if (range === "1") {
              label = format(d, "HH:mm");
            } else if (range === "7") {
              label = format(d, "EEE HH:mm");
            } else {
              label = format(d, "MMM dd");
            }
            return { time: timestamp, price, label };
          }
        );

        setData(points);
        setLastUpdated(new Date());
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useEffect(() => {
    fetchData();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchData(true), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const startPrice = data.length > 0 ? data[0].price : 0;
  const change = currentPrice - startPrice;
  const changePct = startPrice !== 0 ? (change / startPrice) * 100 : 0;
  const isUp = change >= 0;

  const minPrice = data.length > 0 ? Math.min(...data.map((d) => d.price)) : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map((d) => d.price)) : 0;
  const domainPadding = (maxPrice - minPrice) * 0.05 || 100;

  const formatPrice = (val: number) =>
    val.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload as PricePoint;
    return (
      <div className="bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs">
        <div className="text-zinc-400">
          {format(new Date(point.time), "MMM dd, yyyy HH:mm")}
        </div>
        <div className="text-white font-bold text-sm mt-0.5">
          {formatPrice(point.price)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {loading ? "..." : formatPrice(currentPrice)}
            </span>
            {!loading && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-mono border-0",
                  isUp
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                )}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {isUp ? "+" : ""}
                {changePct.toFixed(2)}%
              </Badge>
            )}
          </div>
          <div className="text-xs text-zinc-500">
            {!loading && (
              <>
                {isUp ? "+" : ""}
                {formatPrice(change)} ·{" "}
                {RANGES.find((r) => r.key === range)?.label}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={cn("w-4 h-4", refreshing && "animate-spin")}
            />
          </button>
          {lastUpdated && (
            <span className="text-[10px] text-zinc-600">
              {format(lastUpdated, "HH:mm:ss")}
            </span>
          )}
        </div>
      </div>

      {/* Range Tabs */}
      <Tabs value={range} onValueChange={setRange}>
        <TabsList className="bg-zinc-800/50 h-7">
          {RANGES.map((r) => (
            <TabsTrigger
              key={r.key}
              value={r.key}
              className="text-xs h-5 px-3 data-[state=active]:bg-zinc-700"
            >
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Chart */}
      <div className="w-full" style={{ height: "calc(100% - 130px)", minHeight: 200 }}>
        {loading ? (
          <div className="space-y-2 pt-4">
            <Skeleton className="w-full h-4 bg-zinc-800" />
            <Skeleton className="w-full h-[200px] bg-zinc-800" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">
            {error} — tap refresh to retry
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isUp ? "#34d399" : "#f87171"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={isUp ? "#34d399" : "#f87171"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                domain={[minPrice - domainPadding, maxPrice + domainPadding]}
                tick={{ fill: "#71717a", fontSize: 10 }}
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
                stroke={isUp ? "#34d399" : "#f87171"}
                strokeWidth={1.5}
                fill="url(#priceGrad)"
                dot={false}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
