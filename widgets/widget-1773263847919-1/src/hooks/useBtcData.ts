import { useState, useEffect, useCallback, useRef } from "react";

export interface PricePoint {
  time: string;
  timestamp: number;
  price: number;
}

export interface BtcData {
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
  history: PricePoint[];
}

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export function useBtcData(days: number = 1) {
  const [data, setData] = useState<BtcData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const priceUrl = `${COINGECKO_BASE}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
      const chartUrl = `${COINGECKO_BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&precision=2`;

      const [priceRes, chartRes] = await Promise.all([
        fetch("/api/proxy?url=" + encodeURIComponent(priceUrl)),
        fetch("/api/proxy?url=" + encodeURIComponent(chartUrl)),
      ]);

      if (!priceRes.ok || !chartRes.ok) {
        throw new Error("API request failed");
      }

      const priceData = await priceRes.json();
      const chartData = await chartRes.json();

      const btc = priceData.bitcoin;
      const prices: number[][] = chartData.prices || [];

      // Determine interval for labels based on days
      const history: PricePoint[] = prices.map(([ts, price]: [number, number]) => {
        const d = new Date(ts);
        let timeLabel: string;
        if (days <= 1) {
          timeLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (days <= 7) {
          timeLabel = d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        } else {
          timeLabel = d.toLocaleDateString([], { month: "short", day: "numeric" });
        }
        return { time: timeLabel, timestamp: ts, price };
      });

      // Calculate 24h high/low from chart data
      const last24hPrices = prices.filter(
        ([ts]: [number, number]) => ts >= Date.now() - 86400000
      );
      const priceValues = last24hPrices.map(([, p]: [number, number]) => p);
      const high24h = priceValues.length > 0 ? Math.max(...priceValues) : btc.usd;
      const low24h = priceValues.length > 0 ? Math.min(...priceValues) : btc.usd;

      setData({
        currentPrice: btc.usd,
        change24h: btc.usd * (btc.usd_24h_change / 100),
        changePercent24h: btc.usd_24h_change,
        high24h,
        low24h,
        marketCap: btc.usd_market_cap,
        volume24h: btc.usd_24h_vol,
        lastUpdated: new Date().toLocaleTimeString(),
        history,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
      setCountdown(60);
    }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchData();

    // Refresh every 60s
    intervalRef.current = setInterval(fetchData, 60000);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, countdown, refresh };
}
