"""
Utilitários para agrupar entradas de log em buckets temporais
(anual / mensal / semanal) e preencher buckets vazios.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Literal

Granularity = Literal["year", "month", "week"]


def bucket_key(dt: datetime | date, granularity: Granularity) -> str:
    if granularity == "year":
        return f"{dt.year:04d}"
    if granularity == "month":
        return f"{dt.year:04d}-{dt.month:02d}"
    iso = dt.isocalendar()
    return f"{iso[0]:04d}-W{iso[1]:02d}"


def _iter_buckets(start: date, end: date, granularity: Granularity):
    if granularity == "year":
        for y in range(start.year, end.year + 1):
            yield bucket_key(date(y, 1, 1), "year")
        return

    if granularity == "month":
        y, m = start.year, start.month
        while (y, m) <= (end.year, end.month):
            yield bucket_key(date(y, m, 1), "month")
            m += 1
            if m == 13:
                m = 1
                y += 1
        return

    current = start - timedelta(days=start.weekday())
    end_monday = end - timedelta(days=end.weekday())
    seen = set()
    while current <= end_monday:
        key = bucket_key(current, "week")
        if key not in seen:
            seen.add(key)
            yield key
        current += timedelta(days=7)


def fill_gaps(
    counts: dict[str, dict[str, int]],
    start: date,
    end: date,
    granularity: Granularity,
) -> list[dict]:
    result: list[dict] = []
    for key in _iter_buckets(start, end, granularity):
        entry = counts.get(key, {"pages": 0, "pages_gross": 0, "sessions": 0})
        result.append({
            "bucket": key,
            "pages": entry.get("pages", 0),
            "pages_gross": entry.get("pages_gross", 0),
            "sessions": entry.get("sessions", 0),
        })
    return result
