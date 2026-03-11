import { useState, useEffect, useCallback, useRef } from "react";

export interface PricePoint {
  time: number;
  price: number;
  label: string;
}

export interface BtcData {
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  history: PricePoint[];
  lastUpdated: Date | null;
}

const INITIAL_STATE: BtcData = {
  currentPrice: 0,
  change24h: 0,
  changePercent24h: 0,
  high24h: 0,
  low24h: 0,
  history: [],
  lastUpdated: null,
};

export function useBtcPrice(intervalMs = 60_000) {
  const [data, setData] = useState<BtcData>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch market chart (24h) and current price in parallel
      const chartUrl = encodeURIComponent(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1"
      );
      const priceUrl = encodeURIComponent(
        "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false"
      );

      const [chartRes, priceRes] = await Promise.all([
        fetch(`/api/proxy?url=${chartUrl}`),
        fetch(`/api/proxy?url=${priceUrl}`),
      ]);

      if (!chartRes.ok || !priceRes.ok) {
        throw new Error("API request failed");
      }

      const chartJson = await chartRes.json();
      const priceJson = await priceRes.json();

      if (!mountedRef.current) return;

      const history: PricePoint[] = (chartJson.prices || []).map(
        ([timestamp, price]: [number, number]) => {
          const d = new Date(timestamp);
          const hours = d.getHours().toString().padStart(2, "0");
          const mins = d.getMinutes().toString().padStart(2, "0");
          return {
            time: timestamp,
            price: Math.round(price * 100) / 100,
            label: `${hours}:${mins}`,
          };
        }
      );

      // Downsample to ~100 points for smooth rendering
      const step = Math.max(1, Math.floor(history.length / 100));
      const sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1);

      const md = priceJson.market_data;
      setData({
        currentPrice: md?.current_price?.usd ?? 0,
        change24h: md?.price_change_24h ?? 0,
        changePercent24h: md?.price_change_percentage_24h ?? 0,
        high24h: md?.high_24h?.usd ?? 0,
        low24h: md?.low_24h?.usd ?? 0,
        history: sampled,
        lastUpdated: new Date(),
      });
      setError(null);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to fetch data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchData, intervalMs]);

  return { data, loading, error, refetch: fetchData };
}
