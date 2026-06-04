from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


class BookImageBase(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    caption: str | None = None


class BookImageCreate(BookImageBase):
    pass


class BookImageOut(BookImageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class ReadingLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    book_id: int
    pages_read: int
    current_page_after: int
    logged_at: datetime


class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    total_pages: int = Field(..., gt=0)
    start_date: date | None = None
    notes: str | None = None
    description: str | None = None
    cover_url: str | None = None


class BookCreate(BookBase):
    current_page: int = Field(default=0, ge=0)
    finish_date: date | None = None


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    total_pages: int | None = Field(default=None, gt=0)
    current_page: int | None = Field(default=None, ge=0)
    start_date: date | None = None
    finish_date: date | None = None
    notes: str | None = None
    description: str | None = None
    cover_url: str | None = None


class BookOut(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    current_page: int
    finish_date: date | None
    created_at: datetime
    updated_at: datetime

    progress_percent: float = 0.0
    daily_average: float = 0.0
    estimated_finish_date: date | None = None
    status: str = "in_progress"

    images: list[BookImageOut] = []
    logs: list[ReadingLogOut] = []


class DashboardStats(BaseModel):
    total_books: int
    in_progress: int
    completed: int
    average_daily_pages: float
    overall_progress: float


class PeriodStats(BaseModel):
    start: date
    end: date
    days: int
    books_completed: int
    books_completed_list: list[BookOut]
    pages_logged: int          # net (positivos + negativos)
    pages_logged_gross: int    # apenas positivos
    pages_corrections: int     # |soma dos negativos|
    pages_total_from_completed: int
    average_per_day: float     # baseado em net / days


class TimeseriesPoint(BaseModel):
    bucket: str
    pages: int           # net
    pages_gross: int     # somente positivos
    sessions: int


class TimeseriesStats(BaseModel):
    start: date
    end: date
    granularity: Literal["year", "month", "week"]
    total_pages: int
    points: list[TimeseriesPoint]
