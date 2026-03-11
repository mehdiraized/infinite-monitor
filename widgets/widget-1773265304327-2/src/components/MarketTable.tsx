import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ParsedMarket, SortField, SortDir } from "../types";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatDate(d: string): string {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function PriceBar({ price, label }: { price: number; label: string }) {
  const pct = Math.round(price * 100);
  const isYes = label === "Yes";
  const color = isYes ? "bg-emerald-500" : "bg-rose-500";
  const textColor = isYes ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <span className={`font-bold text-sm ${textColor} w-[42px] text-right`}>
        {pct}¢
      </span>
      <div className="flex-1 h-[6px] bg-zinc-800 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface MarketTableProps {
  markets: ParsedMarket[];
}

export default function MarketTable({ markets }: MarketTableProps) {
  const [sortField, setSortField] = useState<SortField>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...markets].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "question":
          cmp = a.question.localeCompare(b.question);
          break;
        case "yesPrice":
          cmp = a.yesPrice - b.yesPrice;
          break;
        case "volume":
          cmp = a.volume - b.volume;
          break;
        case "liquidity":
          cmp = a.liquidity - b.liquidity;
          break;
        case "endDate":
          cmp =
            new Date(a.endDate || 0).getTime() -
            new Date(b.endDate || 0).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [markets, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-blue-400" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-blue-400" />
    );
  };

  const SortableHead = ({
    field,
    children,
    className = "",
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none hover:text-zinc-100 transition-colors ${className}`}
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <SortableHead field="question" className="min-w-[280px]">
              Market
            </SortableHead>
            <SortableHead field="yesPrice">Yes</SortableHead>
            <TableHead>No</TableHead>
            <SortableHead field="volume">Volume</SortableHead>
            <SortableHead field="liquidity">Liquidity</SortableHead>
            <SortableHead field="endDate">End Date</SortableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((market) => (
            <TableRow
              key={market.id}
              className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
            >
              <TableCell className="py-3">
                <div className="flex items-start gap-2">
                  <span className="text-zinc-200 text-[13px] leading-snug font-medium">
                    {market.question}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <PriceBar price={market.yesPrice} label="Yes" />
              </TableCell>
              <TableCell>
                <PriceBar price={market.noPrice} label="No" />
              </TableCell>
              <TableCell>
                <span className="text-zinc-300 text-sm font-mono">
                  {formatVolume(market.volume)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-zinc-400 text-sm font-mono">
                  {formatVolume(market.liquidity)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-zinc-400 text-xs">
                  {formatDate(market.endDate)}
                </span>
              </TableCell>
              <TableCell>
                <a
                  href={`https://polymarket.com/event/${market.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-blue-400 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
