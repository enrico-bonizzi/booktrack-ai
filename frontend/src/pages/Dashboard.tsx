import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BooksApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type {
  Book,
  DashboardStats,
  Granularity,
  PeriodStats,
  TimeseriesStats,
} from "../types/book";
import BookCard from "../components/BookCard";
import BookCarousel from "../components/BookCarousel";
import PeriodFilter from "../components/PeriodFilter";
import GranularityToggle from "../components/GranularityToggle";
import ReadingChart from "../components/ReadingChart";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  const initialRange = useMemo(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 29);
    return { start: iso(past), end: iso(today) };
  }, []);
  const [periodStart, setPeriodStart] = useState(initialRange.start);
  const [periodEnd, setPeriodEnd] = useState(initialRange.end);
  const [period, setPeriod] = useState<PeriodStats | null>(null);

  const initialChart = useMemo(() => {
    const y = new Date().getFullYear();
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }, []);
  const [chartStart, setChartStart] = useState(initialChart.start);
  const [chartEnd, setChartEnd] = useState(initialChart.end);
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [series, setSeries] = useState<TimeseriesStats | null>(null);

  useEffect(() => {
    BooksApi.stats().then(setStats).catch(() => {});
    BooksApi.list().then(setBooks).catch(() => {});
  }, []);

  useEffect(() => {
    if (!periodStart || !periodEnd) return;
    BooksApi.periodStats(periodStart, periodEnd).then(setPeriod).catch(() => setPeriod(null));
  }, [periodStart, periodEnd]);

  useEffect(() => {
    if (!chartStart || !chartEnd) return;
    BooksApi.timeseries(chartStart, chartEnd, granularity)
      .then(setSeries)
      .catch(() => setSeries(null));
  }, [chartStart, chartEnd, granularity]);

  const inProgress = books.filter((b) => b.status === "in_progress");
  const firstName = (user?.name || user?.email || "leitor").split(" ")[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 page-enter">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/70 p-6 sm:p-8 text-primary-foreground shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-10 -right-10 text-9xl">📚</div>
          <div className="absolute -bottom-8 -left-8 text-8xl rotate-12">📖</div>
        </div>
        <div className="relative">
          <p className="text-primary-foreground/80 text-sm">Olá, {firstName} 👋</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
            Continue sua jornada de leitura.
          </h1>
          <p className="text-primary-foreground/85 mt-2 max-w-xl text-sm sm:text-base">
            Acompanhe progresso, registre anotações e veja sua evolução em um só painel.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/books/new"
              className="bg-card text-primary hover:bg-card/90 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
            >
              + Cadastrar livro
            </Link>
            <Link
              to="/books"
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Ver biblioteca →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Total de livros" value={stats.total_books} icon="📚" />
          <Stat label="Em andamento" value={stats.in_progress} icon="📖" />
          <Stat label="Concluídos" value={stats.completed} icon="✅" />
          <Stat label="Média diária" value={`${stats.average_daily_pages} pág`} icon="📈" />
        </div>
      )}

      {/* Em andamento */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold text-foreground">📖 Livros em andamento</h2>
          <Link
            to="/books"
            className="text-sm text-primary hover:opacity-80 font-medium"
          >
            Ver todos →
          </Link>
        </div>
        <BookCarousel books={inProgress} />
      </section>

      {/* Período */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold text-foreground">📅 Período</h2>
          <PeriodFilter
            start={periodStart}
            end={periodEnd}
            onChange={(s, e) => {
              setPeriodStart(s);
              setPeriodEnd(e);
            }}
          />
        </div>

        {period && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm">
                <div className="text-muted-foreground text-sm">Leitura registrada (logs)</div>
                <div className="text-3xl font-bold text-foreground mt-1">
                  {period.pages_logged}{" "}
                  <span className="text-lg font-medium text-muted-foreground">páginas</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  em {period.days} dias · média {period.average_per_day} pág/dia
                </div>
                {(period.pages_logged_gross !== period.pages_logged ||
                  period.pages_corrections > 0) && (
                  <div className="text-xs text-muted-foreground mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3">
                    <span>
                      ↑ Avanço bruto:{" "}
                      <strong className="text-foreground">
                        {period.pages_logged_gross}
                      </strong>
                    </span>
                    {period.pages_corrections > 0 && (
                      <span>
                        ↓ Correções:{" "}
                        <strong className="text-foreground">
                          {period.pages_corrections}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm">
                <div className="text-muted-foreground text-sm">Conclusões no período</div>
                <div className="text-3xl font-bold text-foreground mt-1">
                  {period.books_completed}{" "}
                  <span className="text-lg font-medium text-muted-foreground">
                    {period.books_completed === 1 ? "livro" : "livros"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {period.pages_total_from_completed} páginas no total
                </div>
              </div>
            </div>

            {period.books_completed_list.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Livros concluídos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {period.books_completed_list.map((b) => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Gráfico */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold text-foreground">📈 Evolução da leitura</h2>
          <GranularityToggle value={granularity} onChange={setGranularity} />
        </div>
        <PeriodFilter
          start={chartStart}
          end={chartEnd}
          onChange={(s, e) => {
            setChartStart(s);
            setChartEnd(e);
          }}
        />
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm">
          {series && (
            <>
              <div className="text-sm text-muted-foreground mb-3">
                Total no período:{" "}
                <strong className="text-foreground">{series.total_pages} páginas</strong>
              </div>
              <ReadingChart data={series.points} granularity={granularity} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: string;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
        {icon && <span className="text-lg opacity-70">{icon}</span>}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}
