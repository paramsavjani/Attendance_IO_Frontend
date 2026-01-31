import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DistributionData {
  name: string;
  value: number;
  color: string;
}

interface DistributionChartProps {
  data: DistributionData[];
  title?: string;
  className?: string;
}

export function DistributionChart({
  data,
  title,
  className,
}: DistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-all duration-300 hover:opacity-80"
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                formatter={(value: number) => [`${value}%`, "Students"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{item.name}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {item.value}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
