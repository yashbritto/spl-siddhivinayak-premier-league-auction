import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Team } from "../backend.d";

interface TeamPurseChartProps {
  teams: Team[];
  leadingTeamId?: bigint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 text-sm"
        style={{
          background: "oklch(0.13 0.035 265)",
          border: "1px solid oklch(0.78 0.165 85 / 0.3)",
          color: "oklch(0.96 0.015 90)",
        }}
      >
        <p className="font-broadcast text-xs tracking-wider mb-1">{label}</p>
        <p style={{ color: "oklch(0.78 0.165 85)" }}>
          {Number(payload[0].value).toLocaleString()} pts
        </p>
      </div>
    );
  }
  return null;
}

export function TeamPurseChart({ teams, leadingTeamId }: TeamPurseChartProps) {
  const data = teams.map((team) => ({
    name: team.name.length > 10 ? `${team.name.substring(0, 10)}…` : team.name,
    fullName: team.name,
    purse: Number(team.purseAmountLeft),
    id: Number(team.id),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          tick={{ fill: "oklch(0.45 0.02 90)", fontSize: 10 }}
          axisLine={{ stroke: "oklch(0.22 0.04 265)" }}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "oklch(0.65 0.02 90)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "oklch(0.78 0.165 85 / 0.05)" }}
        />
        <Bar dataKey="purse" radius={[0, 2, 2, 0]}>
          {data.map((entry) => (
            <Cell
              key={`cell-${entry.id}`}
              fill={
                leadingTeamId !== undefined &&
                BigInt(entry.id) === leadingTeamId
                  ? "oklch(0.78 0.165 85)"
                  : "oklch(0.5 0.1 265)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
