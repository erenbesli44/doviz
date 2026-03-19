import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Props {
  data: number[];
  color: string; // e.g. '#059669'
}

/**
 * Tiny sparkline chart — no axes, no tooltip, just the line.
 * Used inside MarketSummaryRow.
 */
export default function SparklineChart({ data, color }: Props) {
  const chartData = data.map((v) => ({ v }));

  return (
    <div className="w-32 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
