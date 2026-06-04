import { Link } from "react-router-dom";
import type { Book } from "../types/book";

interface Props {
  book: Book;
}

export default function BookCard({ book }: Props) {
  const statusLabel = {
    not_started: "Não iniciado",
    in_progress: "Em andamento",
    completed: "Concluído",
  }[book.status];

  const statusColor = {
    not_started: "bg-muted text-muted-foreground",
    in_progress: "bg-primary/15 text-primary",
    completed: "bg-success/15 text-success",
  }[book.status];

  return (
    <Link
      to={`/books/${book.id}`}
      className="group bg-card text-card-foreground rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border border-border overflow-hidden flex flex-col hover:-translate-y-0.5"
    >
      <div className="aspect-[2/3] bg-muted flex items-center justify-center overflow-hidden">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-muted-foreground text-3xl">📖</span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-card-foreground line-clamp-2 text-sm leading-snug">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {book.author}
        </p>
        <span
          className={`mt-2 inline-block text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full w-fit ${statusColor}`}
        >
          {statusLabel}
        </span>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>
              {book.current_page} / {book.total_pages}
            </span>
            <span className="font-medium text-foreground">{book.progress_percent}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${book.progress_percent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
