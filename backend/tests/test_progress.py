from datetime import date, timedelta
from app.models.book import Book
from app.services import progress as p


def make_book(current=50, total=200, days_ago=10):
    b = Book()
    b.title = "Teste"
    b.author = "Autor"
    b.total_pages = total
    b.current_page = current
    b.start_date = date.today() - timedelta(days=days_ago)
    b.finish_date = None
    return b


def test_progress_percent():
    assert p.progress_percent(make_book(50, 200)) == 25.0


def test_progress_capped_at_100():
    assert p.progress_percent(make_book(300, 200)) == 100.0


def test_daily_average():
    b = make_book(50, 200, days_ago=10)
    assert p.daily_average(b) == 5.0


def test_estimated_finish_date():
    b = make_book(50, 200, days_ago=10)  # 5 pág/dia, restam 150
    est = p.estimated_finish_date(b)
    assert est is not None
    assert est > date.today()


def test_status_in_progress():
    assert p.book_status(make_book(50, 200)) == "in_progress"


def test_status_completed():
    assert p.book_status(make_book(200, 200)) == "completed"
