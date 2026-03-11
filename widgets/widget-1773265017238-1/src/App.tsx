import React, { useState, useCallback } from "react";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useGoldPrice } from "./hooks/useGoldPrice";
import { PriceDisplay } from "./components/PriceDisplay";
import { GoldChart } from "./components/GoldChart";
import { StatsBar } from "./components/StatsBar";

export default function App() {
  const {
    currentPrice,
    previousPrice,
    change,
    changePercent,
    high,
    low,
    history,
    loading,
    error,
    lastUpdated,
    source,
    refresh,
  } = useGoldPrice(60000); // every 60 seconds

  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 600);
  }, [refresh]);

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <PriceDisplay
            price={currentPrice}
            change={change}
            changePercent={changePercent}
            previousPrice={previousPrice}
            loading={loading}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] gap-1 px-2 py-0.5 ${
              error
                ? "border-red-500/50 text-red-400"
                : "border-emerald-500/50 text-emerald-400"
            }`}
          >
            {error ? <WifiOff size={10} /> : <Wifi size={10} />}
            {error ? "OFFLINE" : "LIVE"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs text-red-300">
            {error} — Will retry in 60s
          </AlertDescription>
        </Alert>
      )}

      <Separator className="bg-zinc-800" />

      {/* Chart */}
      <GoldChart data={history} change={change} />

      <Separator className="bg-zinc-800" />

      {/* Stats */}
      <StatsBar
        high={high}
        low={low}
        dataPoints={history.length}
        lastUpdated={lastUpdated}
        loading={loading}
      />

      {/* Footer info */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] text-zinc-600">
          Auto-refresh: 60s • Data retained for 24h
          {source && ` • Source: ${source}`}
        </span>
        {history.length <= 1 && !loading && (
          <span className="text-[10px] text-amber-500/70">
            Chart populates as new data arrives each minute
          </span>
        )}
      </div>

      <style>{`
        @keyframes flash-green {
          0% { color: #34d399; }
          100% { color: #ffffff; }
        }
        @keyframes flash-red {
          0% { color: #f87171; }
          100% { color: #ffffff; }
        }
        .animate-flash-green {
          animation: flash-green 1s ease-out;
        }
        .animate-flash-red {
          animation: flash-red 1s ease-out;
        }
      `}</style>
    </div>
  );
}
