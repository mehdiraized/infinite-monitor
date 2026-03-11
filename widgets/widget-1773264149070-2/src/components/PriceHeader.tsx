import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BtcData } from "../hooks/useBtcPrice";

interface Props {
  data: BtcData;
}

export function PriceHeader({ data }: Props) {
  const isPositive = data.changePercent24h >= 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-white tracking-tight">
            {fmt(data.currentPrice)}
          </span>
          <Badge
            variant="outline"
            className={`text-sm px-2 py-0.5 border-0 ${
              isPositive
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
            )}
            {isPositive ? "+" : ""}
            {data.changePercent24h.toFixed(2)}%
          </Badge>
        </div>
        <p className="text-xs text-zinc-500">
          24h change:{" "}
          <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
            {isPositive ? "+" : ""}
            {fmt(data.change24h)}
          </span>
        </p>
      </div>
      <div className="text-right space-y-1 text-xs text-zinc-500">
        <p>
          24h High:{" "}
          <span className="text-zinc-300">{fmt(data.high24h)}</span>
        </p>
        <p>
          24h Low:{" "}
          <span className="text-zinc-300">{fmt(data.low24h)}</span>
        </p>
      </div>
    </div>
  );
}
