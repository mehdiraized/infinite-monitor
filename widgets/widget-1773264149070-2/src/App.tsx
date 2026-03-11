import React, { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBtcPrice } from "./hooks/useBtcPrice";
import { PriceHeader } from "./components/PriceHeader";
import { BtcChart } from "./components/BtcChart";

function Countdown({ lastUpdated }: { lastUpdated: Date | null }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (!lastUpdated) return;
    setSeconds(60);
    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <span className="text-zinc-500 text-xs flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {seconds}s
    </span>
  );
}

export default function App() {
  const { data, loading, error, refetch } = useBtcPrice(60_000);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            BTC / USD — 24h
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Countdown lastUpdated={data.lastUpdated} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-white"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-300 text-xs">
            {error} — will retry automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading skeleton */}
      {loading && !data.currentPrice ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48 bg-zinc-800" />
            <Skeleton className="h-8 w-24 bg-zinc-800" />
          </div>
          <Skeleton className="h-[280px] w-full bg-zinc-800" />
        </div>
      ) : (
        <>
          {/* Price header */}
          {data.currentPrice > 0 && <PriceHeader data={data} />}

          {/* Chart */}
          {data.history.length > 0 && (
            <BtcChart
              history={data.history}
              isPositive={data.changePercent24h >= 0}
            />
          )}

          {/* Last updated */}
          {data.lastUpdated && (
            <p className="text-[11px] text-zinc-600 text-right">
              Last updated:{" "}
              {data.lastUpdated.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
