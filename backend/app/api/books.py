import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.book import Book
from app.models.book_image import BookImage
from app.models.reading_log import ReadingLog
from app.models.user import User
from app.schemas.book import (
    BookCreate,
    BookUpdate,
    BookOut,
    BookImageCreate,
    BookImageOut,
    DashboardStats,
    PeriodStats,
    ReadingLogOut,
    TimeseriesStats,
)
from app.services import progress as progress_service
from app.services.google_books import search_book
from app.services.timeseries import bucket_key, fill_gaps


router = APIRouter(prefix="/books", tags=["books"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


def _get_book_or_404(db: Session, book_id: int, user: User) -> Book:
    book = (
        db.query(Book)
        .filter(Book.id == book_id, Book.user_id == user.id)
        .first()
    )
    if not book:
        raise HTTPException(404, "Book not found")
    return book


def _to_out(book: Book, include_logs: bool = False) -> BookOut:
    data = {
        c.name: getattr(book, c.name)
        for c in book.__table__.columns
        if c.name != "user_id"
    }
    data.update(progress_service.enrich(book))
    data["images"] = [BookImageOut.model_validate(i) for i in book.images]
    data["logs"] = (
        [ReadingLogOut.model_validate(l) for l in book.logs] if include_logs else []
    )
    return BookOut.model_validate(data)


@router.get("", response_model=list[BookOut])
def list_books(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    books = (
        db.query(Book)
        .filter(Book.user_id == user.id)
        .order_by(Book.created_at.desc())
        .all()
    )
    return [_to_out(b) for b in books]


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
async def create_book(
    payload: BookCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump()

    if not data.get("cover_url"):
        try:
            meta = await search_book(f"{data['title']} {data['author']}")
            if meta:
                data["cover_url"] = data.get("cover_url") or meta.get("cover_url")
                data["description"] = data.get("description") or meta.get("description")
        except Exception:
            pass

    book = Book(user_id=user.id, **data)
    db.add(book)
    db.commit()
    db.refresh(book)
    return _to_out(book)


@router.get("/{book_id}", response_model=BookOut)
def get_book(
    book_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    book = _get_book_or_404(db, book_id, user)
    return _to_out(book, include_logs=True)


@router.patch("/{book_id}", response_model=BookOut)
def update_book(
    book_id: int,
    payload: BookUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    book = _get_book_or_404(db, book_id, user)

    previous_page = book.current_page

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(book, field, value)

    # Reabrir livro se a página foi reduzida abaixo do total
    if book.finish_date and book.total_pages and book.current_page < book.total_pages:
        # só reabre se o usuário não está explicitamente setando finish_date
        if "finish_date" not in payload.model_fields_set:
            book.finish_date = None

    # Marcar conclusão automaticamente se atingiu o total
    if (
        book.total_pages
        and book.current_page >= book.total_pages
        and not book.finish_date
    ):
        book.finish_date = date.today()

    db.commit()
    db.refresh(book)

    # Log automático: registra qualquer delta != 0 (positivo ou negativo)
    delta = book.current_page - previous_page
    if delta != 0:
        log = ReadingLog(
            book_id=book.id,
            pages_read=delta,
            current_page_after=book.current_page,
        )
        db.add(log)
        db.commit()
        db.refresh(book)

    return _to_out(book, include_logs=True)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    book = _get_book_or_404(db, book_id, user)
    db.delete(book)
    db.commit()


# ---------------- Galeria de imagens ---------------- #

@router.post(
    "/{book_id}/images",
    response_model=BookImageOut,
    status_code=status.HTTP_201_CREATED,
)
def add_image(
    book_id: int,
    payload: BookImageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    book = _get_book_or_404(db, book_id, user)
    img = BookImage(book_id=book.id, **payload.model_dump())
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


@router.post(
    "/{book_id}/images/upload",
    response_model=BookImageOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    book_id: int,
    request: Request,
    file: UploadFile = File(...),
    caption: str | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    book = _get_book_or_404(db, book_id, user)

    # Valida tipo
    ext = Path(file.filename or "").suffix.lower()
    if file.content_type not in ALLOWED_IMAGE_TYPES or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Formato não suportado. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Lê com limite de tamanho
    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(400, "Imagem maior que 5 MB.")
    if not data:
        raise HTTPException(400, "Arquivo vazio.")

    # Salva com nome seguro
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename
    dest.write_bytes(data)

    # URL absoluta baseada no host atual (funciona em dev e prod)
    base = str(request.base_url).rstrip("/")
    url = f"{base}/uploads/{filename}"

    img = BookImage(book_id=book.id, url=url, caption=caption)
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


@router.delete(
    "/{book_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_image(
    book_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_book_or_404(db, book_id, user)  # garante ownership
    img = db.get(BookImage, image_id)
    if not img or img.book_id != book_id:
        raise HTTPException(404, "Image not found")
    db.delete(img)
    db.commit()


# ---------------- Logs ---------------- #

@router.get("/{book_id}/logs", response_model=list[ReadingLogOut])
def list_book_logs(
    book_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_book_or_404(db, book_id, user)
    logs = (
        db.query(ReadingLog)
        .filter(ReadingLog.book_id == book_id)
        .order_by(ReadingLog.logged_at.desc())
        .all()
    )
    return logs


# ---------------- Dashboard ---------------- #

@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    books = db.query(Book).filter(Book.user_id == user.id).all()
    total = len(books)
    completed = sum(1 for b in books if progress_service.book_status(b) == "completed")
    in_progress = sum(1 for b in books if progress_service.book_status(b) == "in_progress")
    avg_daily = (
        round(sum(progress_service.daily_average(b) for b in books) / total, 2)
        if total else 0.0
    )
    overall = (
        round(sum(progress_service.progress_percent(b) for b in books) / total, 2)
        if total else 0.0
    )
    return DashboardStats(
        total_books=total,
        in_progress=in_progress,
        completed=completed,
        average_daily_pages=avg_daily,
        overall_progress=overall,
    )


# ---------------- Estatísticas por período ---------------- #

def _validate_range(start: date, end: date):
    if start > end:
        raise HTTPException(400, "start deve ser <= end")


def _logs_in_range(db: Session, user: User, start: date, end: date):
    end_exclusive = datetime.combine(end + timedelta(days=1), datetime.min.time())
    start_dt = datetime.combine(start, datetime.min.time())
    return (
        db.query(ReadingLog)
        .join(Book, Book.id == ReadingLog.book_id)
        .filter(
            Book.user_id == user.id,
            ReadingLog.logged_at >= start_dt,
            ReadingLog.logged_at < end_exclusive,
        )
        .all()
    )


@router.get("/stats/period", response_model=PeriodStats)
def period_stats(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _validate_range(start, end)

    completed_books = (
        db.query(Book)
        .filter(
            Book.user_id == user.id,
            Book.finish_date.between(start, end),
        )
        .order_by(Book.finish_date.desc())
        .all()
    )

    logs = _logs_in_range(db, user, start, end)
    pages_logged = sum(l.pages_read for l in logs)
    pages_logged_gross = sum(l.pages_read for l in logs if l.pages_read > 0)
    pages_corrections = abs(sum(l.pages_read for l in logs if l.pages_read < 0))

    pages_total_from_completed = sum(b.total_pages for b in completed_books)
    days = (end - start).days + 1
    average_per_day = round(pages_logged / days, 2) if days else 0.0

    return PeriodStats(
        start=start,
        end=end,
        days=days,
        books_completed=len(completed_books),
        books_completed_list=[_to_out(b) for b in completed_books],
        pages_logged=pages_logged,
        pages_logged_gross=pages_logged_gross,
        pages_corrections=pages_corrections,
        pages_total_from_completed=int(pages_total_from_completed),
        average_per_day=average_per_day,
    )


@router.get("/stats/timeseries", response_model=TimeseriesStats)
def timeseries_stats(
    start: date = Query(...),
    end: date = Query(...),
    granularity: Literal["year", "month", "week"] = Query("month"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _validate_range(start, end)
    logs = _logs_in_range(db, user, start, end)

    counts: dict[str, dict[str, int]] = {}
    for log in logs:
        key = bucket_key(log.logged_at, granularity)
        bucket = counts.setdefault(
            key, {"pages": 0, "pages_gross": 0, "sessions": 0}
        )
        bucket["pages"] += log.pages_read
        if log.pages_read > 0:
            bucket["pages_gross"] += log.pages_read
        bucket["sessions"] += 1

    points = fill_gaps(counts, start, end, granularity)
    total_pages = sum(p["pages"] for p in points)

    return TimeseriesStats(
        start=start,
        end=end,
        granularity=granularity,
        total_pages=total_pages,
        points=points,  # type: ignore
    )
