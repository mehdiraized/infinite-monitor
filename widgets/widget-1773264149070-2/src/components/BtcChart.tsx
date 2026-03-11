import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PricePoint } from "../hooks/useBtcPrice";

interface Props {
  history: PricePoint[];
  isPositive: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-semibold">
        $
        {payload[0].value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
};

export function BtcChart({ history, isPositive }: Props) {
  const prices = history.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min) * 0.05;

  const color = isPositive ? "#34d399" : "#f87171";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={history}
        margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
      >
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={Math.floor(history.length / 6)}
        />
        <YAxis
          domain={[min - pad, max + pad]}
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            `$${(v / 1000).toFixed(1)}k`
          }
          width={58}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill="url(#priceGrad)"
          animationDuration={800}
          dot={false}
          activeDot={{ r: 3, stroke: color, fill: "#18181b" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
