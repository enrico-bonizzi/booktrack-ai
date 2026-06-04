from datetime import date, timedelta
from app.models.book import Book


def progress_percent(book: Book) -> float:
    if book.total_pages <= 0:
        return 0.0
    return round(min(book.current_page / book.total_pages * 100, 100), 2)


def daily_average(book: Book, today: date | None = None) -> float:
    if not book.start_date:
        return 0.0
    today = today or date.today()
    # se finalizado, usa o intervalo real de leitura
    end = book.finish_date or today
    days = max((end - book.start_date).days, 1)
    return round(book.current_page / days, 2)


def estimated_finish_date(book: Book, today: date | None = None) -> date | None:
    if not book.start_date or book.finish_date:
        return book.finish_date
    today = today or date.today()
    avg = daily_average(book, today)
    if avg <= 0:
        return None
    remaining = max(book.total_pages - book.current_page, 0)
    if remaining == 0:
        return today
    days_left = int(remaining / avg) + 1
    return today + timedelta(days=days_left)


def book_status(book: Book) -> str:
    if book.finish_date or (book.total_pages and book.current_page >= book.total_pages):
        return "completed"
    if not book.start_date or book.current_page == 0:
        return "not_started"
    return "in_progress"


def enrich(book: Book) -> dict:
    return {
        "progress_percent": progress_percent(book),
        "daily_average": daily_average(book),
        "estimated_finish_date": estimated_finish_date(book),
        "status": book_status(book),
    }
