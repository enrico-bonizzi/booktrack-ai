import logging
from fastapi import APIRouter, HTTPException, Query
from app.services.google_books import search_book

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/lookup")
async def lookup_book(q: str = Query(..., min_length=2, description="Título ou autor")):
    """Busca metadados e capa em Google Books (com fallback p/ Open Library)."""
    try:
        result = await search_book(q)
    except Exception as e:
        logger.exception("Erro ao buscar livro '%s'", q)
        raise HTTPException(
            status_code=502,
            detail=f"Falha ao consultar APIs de livros: {type(e).__name__}: {e}",
        )
    if not result:
        raise HTTPException(404, "Livro não encontrado em nenhuma fonte")
    return result
