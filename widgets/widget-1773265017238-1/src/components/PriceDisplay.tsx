import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number | null;
  change: number;
  changePercent: number;
  previousPrice: number | null;
  loading: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  change,
  changePercent,
  previousPrice,
  loading,
}) => {
  const isUp = change > 0;
  const isDown = change < 0;
  const isFlat = change === 0;

  const flashClass =
    previousPrice !== null && price !== null
      ? price > previousPrice
        ? "animate-flash-green"
        : price < previousPrice
        ? "animate-flash-red"
        : ""
      : "";

  if (loading && price === null) {
    return (
      <div className="flex items-baseline gap-3">
        <div className="h-10 w-40 bg-zinc-800 animate-pulse" />
        <div className="h-6 w-24 bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-amber-400 text-xs font-medium tracking-wider uppercase">
          XAU/USD
        </span>
      </div>
      <span
        className={cn(
          "text-3xl font-bold text-white tabular-nums tracking-tight transition-colors duration-300",
          flashClass
        )}
      >
        ${price?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <div
        className={cn(
          "flex items-center gap-1 text-sm font-medium",
          isUp && "text-emerald-400",
          isDown && "text-red-400",
          isFlat && "text-zinc-400"
        )}
      >
        {isUp && <TrendingUp size={16} />}
        {isDown && <TrendingDown size={16} />}
        {isFlat && <Minus size={16} />}
        <span className="tabular-nums">
          {isUp ? "+" : ""}
          {change.toFixed(2)}
        </span>
        <span className="tabular-nums text-xs">
          ({isUp ? "+" : ""}
          {changePercent.toFixed(3)}%)
        </span>
      </div>
    </div>
  );
};
