import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GoldDataPoint } from "../hooks/useGoldPrice";

interface GoldChartProps {
  data: GoldDataPoint[];
  change: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 px-3 py-2 shadow-lg">
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      <p className="text-amber-400 font-bold tabular-nums">
        ${payload[0].value?.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
};

export const GoldChart: React.FC<GoldChartProps> = ({ data, change }) => {
  const chartColor = change >= 0 ? "#34d399" : "#f87171";
  const gradientId = "goldGradient";

  const domain = useMemo(() => {
    if (data.length === 0) return [0, 0];
    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = Math.max((max - min) * 0.15, 1);
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [data]);

  // Show at most 60 data points on screen
  const displayData = data.slice(-120);

  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-zinc-500 text-sm">
        Waiting for data points...
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={displayData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            domain={domain}
            stroke="#52525b"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={70}
            tickFormatter={(v: number) => `$${v.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: chartColor,
              stroke: "#18181b",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
