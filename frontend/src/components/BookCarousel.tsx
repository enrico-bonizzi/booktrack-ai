import { useRef } from "react";
import type { Book } from "../types/book";
import BookCard from "./BookCard";

interface Props {
  books: Book[];
}

export default function BookCarousel({ books }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (books.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
        Nenhum livro em andamento. Cadastre um novo para começar.
      </div>
    );
  }

  function scroll(direction: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth / 4;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-card shadow-md border border-border hover:bg-muted text-foreground items-center justify-center text-lg"
      >
        ‹
      </button>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 px-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {books.map((b) => (
          <div
            key={b.id}
            className="snap-start shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4"
          >
            <BookCard book={b} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Próximo"
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-card shadow-md border border-border hover:bg-muted text-foreground items-center justify-center text-lg"
      >
        ›
      </button>
    </div>
  );
}
