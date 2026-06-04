import { useEffect, useMemo, useState } from "react";
import { BooksApi } from "../services/api";
import type { Book } from "../types/book";
import BookCard from "../components/BookCard";

type StatusFilter = "all" | "in_progress" | "not_started" | "completed";
type SortKey =
  | "created_desc"
  | "created_asc"
  | "title_asc"
  | "title_desc"
  | "author_asc";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "in_progress", label: "Em andamento" },
  { value: "not_started", label: "Não iniciados" },
  { value: "completed", label: "Finalizados" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "created_desc", label: "Mais recentes" },
  { value: "created_asc", label: "Mais antigos" },
  { value: "title_asc", label: "Título (A-Z)" },
  { value: "title_desc", label: "Título (Z-A)" },
  { value: "author_asc", label: "Autor (A-Z)" },
];

export default function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("created_desc");

  useEffect(() => {
    BooksApi.list().then(setBooks);
  }, []);

  const visible = useMemo(() => {
    let list = books.filter(
      (b) =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
    );
    if (status !== "all") list = list.filter((b) => b.status === status);

    const sorters: Record<SortKey, (a: Book, b: Book) => number> = {
      created_desc: (a, b) => b.created_at.localeCompare(a.created_at),
      created_asc: (a, b) => a.created_at.localeCompare(b.created_at),
      title_asc: (a, b) => a.title.localeCompare(b.title, "pt-BR"),
      title_desc: (a, b) => b.title.localeCompare(a.title, "pt-BR"),
      author_asc: (a, b) => a.author.localeCompare(b.author, "pt-BR"),
    };
    return [...list].sort(sorters[sort]);
  }, [books, search, status, sort]);

  const counts = useMemo(
    () => ({
      all: books.length,
      in_progress: books.filter((b) => b.status === "in_progress").length,
      not_started: books.filter((b) => b.status === "not_started").length,
      completed: books.filter((b) => b.status === "completed").length,
    }),
    [books]
  );

  const inputCls =
    "px-3 py-2 bg-background border border-input text-foreground rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 page-enter">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Biblioteca</h1>
          <p className="text-muted-foreground text-sm">
            {counts.all} {counts.all === 1 ? "livro cadastrado" : "livros cadastrados"}
          </p>
        </div>
        <input
          type="text"
          placeholder="🔍 Buscar por título ou autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} w-full sm:w-72`}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {opt.label}
                <span
                  className={`ml-2 text-xs ${
                    active ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {counts[opt.value]}
                </span>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Ordenar por:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={inputCls}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
          Nenhum livro encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
