import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Granularity, TimeseriesPoint } from "../types/book";

interface Props {
  data: TimeseriesPoint[];
  granularity: Granularity;
}

function formatLabel(bucket: string, granularity: Granularity): string {
  if (granularity === "year") return bucket;
  if (granularity === "month") {
    const [y, m] = bucket.split("-");
    const months = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];
    return `${months[Number(m) - 1]}/${y.slice(2)}`;
  }
  const [y, w] = bucket.split("-W");
  return `Sem ${w}/${y.slice(2)}`;
}

export default function ReadingChart({ data, granularity }: Props) {
  const formatted = data.map((p) => ({
    ...p,
    label: formatLabel(p.bucket, granularity),
  }));

  if (formatted.length === 0 || formatted.every((p) => p.pages === 0)) {
    return (
      <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
        Nenhuma página registrada nesse período.
      </div>
    );
  }

  return (
    <div className="h-48 sm:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--muted-foreground)" />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} stroke="var(--muted-foreground)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 13,
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
            formatter={(value: number, name: string) => {
              if (name === "pages") return [`${value} páginas`, "Páginas"];
              if (name === "sessions") return [`${value}`, "Sessões"];
              return [value, name];
            }}
            labelFormatter={(label) => `Período: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="pages"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--primary)" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="var(--muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
