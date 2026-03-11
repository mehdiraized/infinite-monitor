import { useState, useEffect, useCallback } from "react";
import { PolymarketEvent, ParsedMarket } from "../types";

const GAMMA_API = "https://gamma-api.polymarket.com";

function parseMarkets(events: PolymarketEvent[]): ParsedMarket[] {
  const markets: ParsedMarket[] = [];

  for (const event of events) {
    if (!event.markets) continue;
    for (const market of event.markets) {
      if (market.closed) continue;

      // Check if the question contains bitcoin/btc
      const q = (market.question || "").toLowerCase();
      const title = (event.title || "").toLowerCase();
      const combined = q + " " + title;
      if (!combined.includes("bitcoin") && !combined.includes("btc")) continue;

      let yesPrice = 0;
      let noPrice = 0;
      try {
        const prices = JSON.parse(market.outcomePrices || "[]");
        yesPrice = parseFloat(prices[0]) || 0;
        noPrice = parseFloat(prices[1]) || 0;
      } catch {}

      markets.push({
        id: market.id,
        question: market.question,
        slug: market.slug,
        yesPrice,
        noPrice,
        volume: parseFloat(market.volume) || 0,
        liquidity: parseFloat(market.liquidity) || 0,
        endDate: market.endDate || event.endDate || "",
        image: market.image || event.image || "",
      });
    }
  }

  return markets;
}

export function usePolymarketData() {
  const [markets, setMarkets] = useState<ParsedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch active events with high volume, multiple pages
      const urls = [
        `${GAMMA_API}/events?active=true&closed=false&limit=100&offset=0&order=volume24hr&ascending=false`,
        `${GAMMA_API}/events?active=true&closed=false&limit=100&offset=100&order=volume24hr&ascending=false`,
        `${GAMMA_API}/events?active=true&closed=false&limit=100&offset=200&order=volume24hr&ascending=false`,
      ];

      const results = await Promise.all(
        urls.map(async (url) => {
          const res = await fetch(
            "/api/proxy?url=" + encodeURIComponent(url)
          );
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          return res.json();
        })
      );

      const allEvents: PolymarketEvent[] = results.flat();
      const parsed = parseMarkets(allEvents);

      // Deduplicate by id
      const seen = new Set<string>();
      const unique = parsed.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      // Sort by volume desc
      unique.sort((a, b) => b.volume - a.volume);

      setMarkets(unique);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  return { markets, loading, error, lastUpdated, refetch: fetchData };
}
