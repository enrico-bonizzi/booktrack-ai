import { useMemo } from "react";

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PeriodFilter({ start, end, onChange }: Props) {
  const presets = useMemo(() => {
    const today = new Date();
    const todayIso = iso(today);
    const minus = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return iso(d);
    };
    const monthStart = iso(new Date(today.getFullYear(), today.getMonth(), 1));
    const yearStart = iso(new Date(today.getFullYear(), 0, 1));
    const yearEnd = iso(new Date(today.getFullYear(), 11, 31));

    return [
      { label: "7 dias", start: minus(6), end: todayIso },
      { label: "30 dias", start: minus(29), end: todayIso },
      { label: "Este mês", start: monthStart, end: todayIso },
      { label: "Este ano", start: yearStart, end: yearEnd },
    ];
  }, []);

  const inputCls =
    "px-2 py-1.5 bg-background border border-input text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50";

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => onChange(e.target.value, end)}
          className={inputCls}
        />
        <span className="text-muted-foreground text-sm">até</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onChange(start, e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.start, p.end)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-muted hover:bg-accent text-foreground transition"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
