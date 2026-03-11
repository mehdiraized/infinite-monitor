import { useState, useEffect, useCallback, useRef } from "react";

export interface PricePoint {
  time: string;
  timestamp: number;
  price: number;
}

export interface BtcData {
  prices: PricePoint[];
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: Date;
}

const COINGECKO_MARKET_CHART =
  "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1";
const COINGECKO_PRICE =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true";

export function useBtcData() {
  const [data, setData] = useState<BtcData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [chartRes, priceRes] = await Promise.all([
        fetch("/api/proxy?url=" + encodeURIComponent(COINGECKO_MARKET_CHART)),
        fetch("/api/proxy?url=" + encodeURIComponent(COINGECKO_PRICE)),
      ]);

      if (!chartRes.ok || !priceRes.ok) {
        throw new Error("API request failed");
      }

      const chartJson = await chartRes.json();
      const priceJson = await priceRes.json();

      const prices: PricePoint[] = chartJson.prices.map(
        ([ts, price]: [number, number]) => ({
          time: new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: ts,
          price: Math.round(price * 100) / 100,
        })
      );

      // Thin out data to ~72 points for cleaner chart
      const step = Math.max(1, Math.floor(prices.length / 72));
      const thinned = prices.filter((_, i) => i % step === 0 || i === prices.length - 1);

      const allPrices = thinned.map((p) => p.price);
      const currentPrice = priceJson.bitcoin.usd;
      const changePercent = priceJson.bitcoin.usd_24h_change;
      const change24h = currentPrice * (changePercent / 100);

      setData({
        prices: thinned,
        currentPrice,
        change24h,
        changePercent24h: changePercent,
        high24h: Math.max(...allPrices),
        low24h: Math.min(...allPrices),
        lastUpdated: new Date(),
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
