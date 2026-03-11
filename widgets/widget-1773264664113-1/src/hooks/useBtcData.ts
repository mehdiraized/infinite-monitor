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
  history: PricePoint[];
  lastUpdated: Date;
}

const COINGECKO_MARKET =
  "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1";
const COINGECKO_PRICE =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_high_24hr=true&include_low_24hr=true";

export function useBtcData(intervalMs = 60_000) {
  const [data, setData] = useState<BtcData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const lastFetchRef = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const [histRes, priceRes] = await Promise.all([
        fetch("/api/proxy?url=" + encodeURIComponent(COINGECKO_MARKET)),
        fetch("/api/proxy?url=" + encodeURIComponent(COINGECKO_PRICE)),
      ]);

      if (!histRes.ok || !priceRes.ok) throw new Error("API request failed");

      const histJson = await histRes.json();
      const priceJson = await priceRes.json();

      const prices: [number, number][] = histJson.prices || [];

      // Sample every ~5 minutes for a cleaner chart
      const step = Math.max(1, Math.floor(prices.length / 288));
      const history: PricePoint[] = prices
        .filter((_: [number, number], i: number) => i % step === 0 || i === prices.length - 1)
        .map(([ts, price]: [number, number]) => {
          const d = new Date(ts);
          const hours = d.getHours().toString().padStart(2, "0");
          const mins = d.getMinutes().toString().padStart(2, "0");
          return {
            time: `${hours}:${mins}`,
            timestamp: ts,
            price: Math.round(price * 100) / 100,
          };
        });

      const btc = priceJson.bitcoin;
      setData({
        currentPrice: btc.usd,
        change24h: btc.usd_24h_change || 0,
        changePercent24h: btc.usd_24h_change || 0,
        high24h: btc.usd_24h_high || Math.max(...history.map((p) => p.price)),
        low24h: btc.usd_24h_low || Math.min(...history.map((p) => p.price)),
        history,
        lastUpdated: new Date(),
      });
      setError(null);
      lastFetchRef.current = Date.now();
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || "Failed to fetch BTC data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const dataInterval = setInterval(fetchData, intervalMs);
    return () => clearInterval(dataInterval);
  }, [fetchData, intervalMs]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastFetchRef.current) / 1000);
      const remaining = Math.max(0, Math.round(intervalMs / 1000) - elapsed);
      setCountdown(remaining);
    }, 1000);
    return () => clearInterval(tick);
  }, [intervalMs]);

  return { data, loading, error, countdown, refetch: fetchData };
}
