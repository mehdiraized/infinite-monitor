import { useState, useEffect, useCallback, useRef } from "react";

export interface GoldDataPoint {
  time: string;
  timestamp: number;
  price: number;
}

export interface GoldPriceState {
  currentPrice: number | null;
  previousPrice: number | null;
  change: number;
  changePercent: number;
  high: number | null;
  low: number | null;
  history: GoldDataPoint[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  source: string;
}

const STORAGE_KEY = "gold_price_history_v2";

function loadHistory(): GoldDataPoint[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as GoldDataPoint[];
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return parsed.filter((p) => p.timestamp > cutoff);
    }
  } catch {}
  return [];
}

function saveHistory(history: GoldDataPoint[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-1440)));
  } catch {}
}

// --- API source functions ---

async function fetchFromGoldApi(proxyUrl: string): Promise<{ price: number; source: string }> {
  // gold-api.com - free, no auth, no rate limits
  const url = "https://api.gold-api.com/price/XAU";
  const res = await fetch(proxyUrl + encodeURIComponent(url));
  if (!res.ok) throw new Error(`gold-api.com: HTTP ${res.status}`);
  const data = await res.json();
  // Expected: { price: number, ... } or { price_troy_ounce: number }
  const price = data?.price ?? data?.price_troy_ounce ?? data?.price_usd;
  if (!price || isNaN(price)) throw new Error("gold-api.com: invalid response");
  return { price: Number(price), source: "gold-api.com" };
}

async function fetchFromYahooFinance(proxyUrl: string): Promise<{ price: number; source: string }> {
  // Yahoo Finance GC=F gold futures
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d";
  const res = await fetch(proxyUrl + encodeURIComponent(url));
  if (!res.ok) throw new Error(`Yahoo Finance: HTTP ${res.status}`);
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  if (!price || isNaN(price)) throw new Error("Yahoo Finance: invalid response");
  return { price: Number(price), source: "Yahoo Finance" };
}

async function fetchFromFreeGoldApi(): Promise<{ price: number; source: string }> {
  // freegoldapi.com - CORS enabled, no proxy needed, daily data
  const res = await fetch("https://freegoldapi.com/data/latest.json");
  if (!res.ok) throw new Error(`freegoldapi.com: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error("freegoldapi.com: empty data");
  const latest = data[data.length - 1];
  const price = latest?.price;
  if (!price || isNaN(price)) throw new Error("freegoldapi.com: invalid price");
  return { price: Number(price), source: "freegoldapi.com (daily)" };
}

async function fetchFromMetalsDevApi(proxyUrl: string): Promise<{ price: number; source: string }> {
  // Alternative: frankfurter-like metals endpoint
  const url = "https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies=XAU";
  const res = await fetch(proxyUrl + encodeURIComponent(url));
  if (!res.ok) throw new Error(`metalpriceapi: HTTP ${res.status}`);
  const data = await res.json();
  const rate = data?.rates?.XAU;
  if (!rate || isNaN(rate)) throw new Error("metalpriceapi: invalid response");
  // Rate is USD per XAU inverse (how many XAU per 1 USD), so invert
  const price = 1 / Number(rate);
  if (!price || !isFinite(price)) throw new Error("metalpriceapi: conversion error");
  return { price, source: "metalpriceapi.com" };
}

async function fetchGoldPriceWithFallbacks(proxyUrl: string): Promise<{ price: number; source: string }> {
  const sources = [
    () => fetchFromGoldApi(proxyUrl),
    () => fetchFromYahooFinance(proxyUrl),
    () => fetchFromMetalsDevApi(proxyUrl),
    () => fetchFromFreeGoldApi(),
  ];

  const errors: string[] = [];

  for (const fetcher of sources) {
    try {
      return await fetcher();
    } catch (err: any) {
      errors.push(err.message || "Unknown error");
    }
  }

  throw new Error(`All sources failed: ${errors.join("; ")}`);
}

// --- Fetch recent daily history from freegoldapi for initial chart ---
async function fetchDailyHistory(): Promise<GoldDataPoint[]> {
  try {
    const res = await fetch("https://freegoldapi.com/data/latest.json");
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Get last 30 days of data
    const recent = data
      .filter((d: any) => d.price && !isNaN(d.price))
      .slice(-30)
      .map((d: any) => {
        const date = new Date(d.date);
        return {
          time: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          timestamp: date.getTime(),
          price: Math.round(Number(d.price) * 100) / 100,
        } as GoldDataPoint;
      });

    return recent;
  } catch {
    return [];
  }
}

export function useGoldPrice(intervalMs: number = 60000) {
  const [state, setState] = useState<GoldPriceState>({
    currentPrice: null,
    previousPrice: null,
    change: 0,
    changePercent: 0,
    high: null,
    low: null,
    history: loadHistory(),
    loading: true,
    error: null,
    lastUpdated: null,
    source: "",
  });

  const prevPriceRef = useRef<number | null>(null);
  const firstPriceRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  const proxyUrl = "/api/proxy?url=";

  const fetchPrice = useCallback(async () => {
    try {
      const { price, source } = await fetchGoldPriceWithFallbacks(proxyUrl);

      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const newPoint: GoldDataPoint = {
        time: timeStr,
        timestamp: now.getTime(),
        price: Math.round(price * 100) / 100,
      };

      if (firstPriceRef.current === null) {
        firstPriceRef.current = price;
      }

      const previousPrice = prevPriceRef.current;
      prevPriceRef.current = price;

      setState((prev) => {
        // Avoid duplicate timestamps (within 30 seconds)
        const lastPoint = prev.history[prev.history.length - 1];
        const isDuplicate =
          lastPoint && Math.abs(lastPoint.timestamp - newPoint.timestamp) < 30000;

        const newHistory = isDuplicate
          ? [...prev.history.slice(0, -1), newPoint]
          : [...prev.history, newPoint];

        saveHistory(newHistory);

        const prices = newHistory.map((p) => p.price);
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const firstPrice = firstPriceRef.current ?? price;
        const change = price - firstPrice;
        const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

        return {
          currentPrice: price,
          previousPrice: previousPrice,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 1000) / 1000,
          high,
          low,
          history: newHistory,
          loading: false,
          error: null,
          lastUpdated: now,
          source,
        };
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to fetch gold price",
      }));
    }
  }, []);

  // Load initial daily history if we have no stored history
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const stored = loadHistory();
      if (stored.length < 2) {
        // Seed with daily history
        const dailyHistory = await fetchDailyHistory();
        if (dailyHistory.length > 0) {
          setState((prev) => ({
            ...prev,
            history: dailyHistory,
          }));
          saveHistory(dailyHistory);
        }
      }
      // Then fetch live price
      fetchPrice();
    };

    init();
  }, [fetchPrice]);

  // Set up polling
  useEffect(() => {
    const id = setInterval(fetchPrice, intervalMs);
    return () => clearInterval(id);
  }, [fetchPrice, intervalMs]);

  return { ...state, refresh: fetchPrice };
}
