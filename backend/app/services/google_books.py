"""
Serviço de busca de metadados de livros.

Pipeline:
1. Google Books (top 5, melhor score por completude)
2. Open Library Search (top 5, melhor score)
3. Merge dos resultados (campo a campo)
4. Se faltar total_pages e tivermos ISBN:
   a) Open Library /isbn/{isbn}.json (página exata da edição)
   b) Google Books q=isbn:{isbn}
5. Se ainda faltar campos críticos → fallback IA (Claude / OpenAI)
6. Fallback de capa por ISBN (Open Library Covers)

Nota: Amazon Product Advertising API foi avaliada e descartada para o MVP
por exigir credenciais de afiliado e aprovação manual. Pode ser adicionada
no futuro seguindo o mesmo padrão de fonte (uma função async + entrada no merge).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.services.ai_fallback import ai_enrich, has_missing_fields

logger = logging.getLogger(__name__)

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json"
OPEN_LIBRARY_ISBN = "https://openlibrary.org/isbn/{isbn}.json"
OPEN_LIBRARY_COVER_ID = "https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
OPEN_LIBRARY_COVER_ISBN = "https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"

EMPTY: dict[str, Any] = {
    "title": None,
    "author": None,
    "total_pages": None,
    "description": None,
    "cover_url": None,
    "published_date": None,
    "categories": [],
    "isbn": None,
    "sources": [],
}


# ----------------------------- Google Books ----------------------------- #

async def _google_books(client: httpx.AsyncClient, query: str) -> dict | None:
    params: dict[str, Any] = {"q": query, "maxResults": 5}
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY

    r = await client.get(GOOGLE_BOOKS_URL, params=params)
    r.raise_for_status()
    items = (r.json() or {}).get("items") or []
    if not items:
        return None

    def score(it: dict) -> int:
        info = it.get("volumeInfo", {})
        s = 0
        if info.get("pageCount"):
            s += 3
        if info.get("imageLinks", {}).get("thumbnail"):
            s += 2
        if info.get("description"):
            s += 1
        if info.get("industryIdentifiers"):
            s += 1
        return s

    best = max(items, key=score)
    return _google_item_to_dict(best, source="google_books")


def _google_item_to_dict(item: dict, source: str) -> dict:
    info = item.get("volumeInfo", {})
    images = info.get("imageLinks", {})
    cover = images.get("thumbnail") or images.get("smallThumbnail")
    if cover:
        cover = cover.replace("http://", "https://")

    isbn = None
    for ident in info.get("industryIdentifiers", []) or []:
        if ident.get("type") in ("ISBN_13", "ISBN_10"):
            isbn = ident.get("identifier")
            if ident.get("type") == "ISBN_13":
                break

    return {
        "title": info.get("title"),
        "author": ", ".join(info.get("authors", []) or []) or None,
        "total_pages": info.get("pageCount"),
        "description": info.get("description"),
        "cover_url": cover,
        "published_date": info.get("publishedDate"),
        "categories": info.get("categories", []) or [],
        "isbn": isbn,
        "sources": [source],
    }


async def _google_books_by_isbn(client: httpx.AsyncClient, isbn: str) -> dict | None:
    params: dict[str, Any] = {"q": f"isbn:{isbn}", "maxResults": 1}
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY
    r = await client.get(GOOGLE_BOOKS_URL, params=params)
    r.raise_for_status()
    items = (r.json() or {}).get("items") or []
    if not items:
        return None
    return _google_item_to_dict(items[0], source="google_books_isbn")


# ----------------------------- Open Library ----------------------------- #

async def _open_library(client: httpx.AsyncClient, query: str) -> dict | None:
    params = {"q": query, "limit": 5}
    r = await client.get(OPEN_LIBRARY_SEARCH, params=params)
    r.raise_for_status()
    docs = (r.json() or {}).get("docs") or []
    if not docs:
        return None

    def score(d: dict) -> int:
        s = 0
        if d.get("number_of_pages_median"):
            s += 3
        if d.get("cover_i"):
            s += 2
        if d.get("isbn"):
            s += 1
        return s

    d = max(docs, key=score)
    cover = OPEN_LIBRARY_COVER_ID.format(cover_id=d["cover_i"]) if d.get("cover_i") else None
    isbn = (d.get("isbn") or [None])[0]
    return {
        "title": d.get("title"),
        "author": ", ".join(d.get("author_name", []) or []) or None,
        "total_pages": d.get("number_of_pages_median"),
        "description": None,
        "cover_url": cover,
        "published_date": str(d.get("first_publish_year") or "") or None,
        "categories": (d.get("subject") or [])[:5],
        "isbn": isbn,
        "sources": ["open_library"],
    }


async def _open_library_isbn(client: httpx.AsyncClient, isbn: str) -> dict | None:
    """Consulta direta de edição pelo ISBN — costuma ter número exato de páginas."""
    r = await client.get(OPEN_LIBRARY_ISBN.format(isbn=isbn), follow_redirects=True)
    if r.status_code != 200:
        return None
    data = r.json()
    pages = data.get("number_of_pages")
    if not pages:
        return None
    return {
        "title": data.get("title"),
        "author": None,
        "total_pages": pages,
        "description": None,
        "cover_url": None,
        "published_date": data.get("publish_date"),
        "categories": [],
        "isbn": isbn,
        "sources": ["open_library_isbn"],
    }


# ----------------------------- Merge ----------------------------- #

def _merge(*results: dict | None) -> dict | None:
    results = [r for r in results if r]
    if not results:
        return None

    merged: dict[str, Any] = dict(EMPTY)
    sources: list[str] = []

    for r in results:
        for k, v in r.items():
            if k == "sources":
                sources.extend(v)
                continue
            current = merged.get(k)
            is_empty = current in (None, "", [], 0)
            if is_empty and v not in (None, "", [], 0):
                merged[k] = v

    merged["sources"] = sources
    return merged


# ----------------------------- API pública ----------------------------- #

async def search_book(query: str) -> dict | None:
    async with httpx.AsyncClient(timeout=15) as client:
        results = await asyncio.gather(
            _safe(_google_books(client, query), "google_books"),
            _safe(_open_library(client, query), "open_library"),
        )
        merged = _merge(*results)

        # Reforço por ISBN se faltar total_pages
        if merged and not merged.get("total_pages") and merged.get("isbn"):
            isbn = merged["isbn"]
            extras = await asyncio.gather(
                _safe(_open_library_isbn(client, isbn), "open_library_isbn"),
                _safe(_google_books_by_isbn(client, isbn), "google_books_isbn"),
            )
            merged = _merge(merged, *extras)

        # Fallback IA se ainda faltar
        if has_missing_fields(merged):
            logger.info("Acionando fallback IA para '%s'", query)
            ai_result = await _safe(ai_enrich(query), "ai_fallback")
            merged = _merge(merged, ai_result)

        if not merged:
            return None

        # Capa por ISBN se ainda não tem
        if not merged.get("cover_url") and merged.get("isbn"):
            cover_url = OPEN_LIBRARY_COVER_ISBN.format(isbn=merged["isbn"])
            try:
                head = await client.head(cover_url, follow_redirects=True)
                if head.status_code == 200:
                    merged["cover_url"] = cover_url
                    merged["sources"].append("open_library_covers")
            except Exception as e:
                logger.debug("Cover ISBN fallback falhou: %s", e)

        return merged


async def _safe(coro, name: str) -> dict | None:
    try:
        return await coro
    except Exception as e:
        logger.warning("Fonte '%s' falhou (%s): %s", name, type(e).__name__, e)
        return None
