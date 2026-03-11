import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Search,
  AlertCircle,
  Bitcoin,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePolymarketData } from "./hooks/usePolymarketData";
import MarketTable from "./components/MarketTable";

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-5 flex-1 bg-zinc-800" />
          <Skeleton className="h-5 w-24 bg-zinc-800" />
          <Skeleton className="h-5 w-24 bg-zinc-800" />
          <Skeleton className="h-5 w-16 bg-zinc-800" />
          <Skeleton className="h-5 w-16 bg-zinc-800" />
          <Skeleton className="h-5 w-20 bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { markets, loading, error, lastUpdated, refetch } =
    usePolymarketData();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  const filtered = markets.filter((m) =>
    m.question.toLowerCase().includes(search.toLowerCase())
  );

  const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);

  return (
    <div className="w-full h-full overflow-auto p-4 space-y-4">
      {/* Header stats row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="border-zinc-700 text-zinc-300 px-2 py-0.5 text-xs"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {markets.length} markets
            </Badge>
            <Badge
              variant="outline"
              className="border-zinc-700 text-zinc-400 px-2 py-0.5 text-xs"
            >
              ${(totalVolume / 1_000_000).toFixed(1)}M total vol
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <Input
              placeholder="Filter markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 pl-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 px-2.5 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="text-[11px] text-zinc-600">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })} · Live
          from{" "}
          <span className="text-zinc-500">gamma-api.polymarket.com</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Alert className="bg-red-950/30 border-red-900/50">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300 text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {loading && !markets.length ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Search className="w-8 h-8 mb-3 opacity-30" />
          <p className="text-sm">
            {search
              ? "No markets match your filter"
              : "No Bitcoin markets found"}
          </p>
        </div>
      ) : (
        <MarketTable markets={filtered} />
      )}
    </div>
  );
}
