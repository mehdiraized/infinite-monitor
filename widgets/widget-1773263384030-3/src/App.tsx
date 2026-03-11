
import { useState, useEffect, useCallback } from "react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PricePoint {
  time: number;
  price: number;
}

const COINGECKO_PRICE_URL =
  "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1";
const COINGECKO_CURRENT_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currency=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true";

type TimeRange = "1d" | "7d" | "30d";

export default function App() {
  const [chartData, setChartData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("1d");

  const daysMap: Record<TimeRange, number> = { "1d": 1, "7d": 7, "30d": 30 };

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const chartUrl = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${daysMap[timeRange]}`;

      const [chartRes, priceRes] = await Promise.all([
        fetch("/api/proxy?url=" + encodeURIComponent(chartUrl)),
        fetch("/api/proxy?url=" + encodeURIComponent(COINGECKO_CURRENT_URL)),
      ]);

      if (!chartRes.ok || !priceRes.ok) throw new Error("API request failed");

      const chartJson = await chartRes.json();
      const priceJson = await priceRes.json();

      const points: PricePoint[] = chartJson.prices.map(
        ([time, price]: [number, number]) => ({
          time,
          price,
        })
      );

      setChartData(points);
      setCurrentPrice(priceJson.bitcoin.usd);
      setChange24h(priceJson.bitcoin.usd_24h_change);
      setMarketCap(priceJson.bitcoin.usd_market_cap);
      setVolume24h(priceJson.bitcoin.usd_24h_vol);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(() => fetchData(), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatPrice = (val: number) =>
    val.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatCompact = (val: number) => {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return formatPrice(val);
  };

  const isPositive = change24h !== null && change24h >= 0;
  const accentColor = isPositive ? "#34d399" : "#f87171";

  const formatXTick = (time: number) => {
    if (timeRange === "1d") return format(new Date(time), "HH:mm");
    if (timeRange === "7d") return format(new Date(time), "EEE");
    return format(new Date(time), "MMM dd");
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload as PricePoint;
    return (
      <div className="bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs">
        <div className="text-zinc-400">
          {format(new Date(point.time), timeRange === "1d" ? "HH:mm" : "MMM dd, HH:mm")}
        </div>
        <div className="text-white font-bold text-sm mt-0.5">
          {formatPrice(point.price)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-full overflow-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-zinc-800 animate-pulse" />
          <div className="space-y-1">
            <div className="h-6 w-40 bg-zinc-800 animate-pulse" />
            <div className="h-4 w-24 bg-zinc-800 animate-pulse" />
          </div>
        </div>
        <div className="h-[300px] w-full bg-zinc-800/50 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full overflow-auto p-4 space-y-4 flex flex-col items-center justify-center">
        <div className="text-red-400 text-sm">{error}</div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="text-zinc-400 hover:text-white text-xs underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const priceMin = Math.min(...chartData.map((d) => d.price));
  const priceMax = Math.max(...chartData.map((d) => d.price));
  const domainPadding = (priceMax - priceMin) * 0.05;

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">₿</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">
                {currentPrice !== null ? formatPrice(currentPrice) : "—"}
              </span>
              {change24h !== null && (
                <Badge
                  className={cn(
                    "text-xs font-mono flex items-center gap-1",
                    isPositive
                      ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-red-500/15 text-red-400 hover:bg-red-500/20"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {isPositive ? "+" : ""}
                  {change24h.toFixed(2)}%
                </Badge>
              )}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-3">
              {marketCap !== null && <span>MCap {formatCompact(marketCap)}</span>}
              {volume24h !== null && <span>Vol {formatCompact(volume24h)}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            className={cn(
              "p-1.5 text-zinc-500 hover:text-white transition-colors",
              refreshing && "animate-spin"
            )}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Time range selector */}
      <div className="flex gap-1">
        {(["1d", "7d", "30d"] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={cn(
              "px-3 py-1 text-xs font-mono transition-colors",
              timeRange === range
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tickFormatter={formatXTick}
              stroke="#52525b"
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={[priceMin - domainPadding, priceMax + domainPadding]}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)
              }
              stroke="#52525b"
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={accentColor}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-zinc-600">
        <span>Source: CoinGecko</span>
        {lastUpdated && (
          <span>
            Updated {format(lastUpdated, "HH:mm:ss")} · refreshes every 60s
          </span>
        )}
      </div>
    </div>
  );
}
