import type { Granularity } from "../types/book";

interface Props {
  value: Granularity;
  onChange: (g: Granularity) => void;
}

const OPTIONS: { label: string; value: Granularity }[] = [
  { label: "Anual", value: "year" },
  { label: "Mensal", value: "month" },
  { label: "Semanal", value: "week" },
];

export default function GranularityToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm bg-card">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 transition ${
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
