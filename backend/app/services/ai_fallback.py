"""
Fallback baseado em IA para enriquecer metadados de livros.

Funciona com Anthropic Claude ou OpenAI (qualquer um que tiver chave).
A IA preenche apenas campos faltantes — nunca sobrescreve dados existentes.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


PROMPT = """Você é um assistente que retorna metadados de livros em JSON.
Dado o título/autor abaixo, retorne SOMENTE um JSON válido (sem markdown, sem texto extra)
com os seguintes campos:

{{
  "title": "título oficial do livro",
  "author": "autor(es) separados por vírgula",
  "total_pages": número inteiro de páginas da edição mais comum (ou null se não souber),
  "description": "sinopse curta em português, máximo 500 caracteres",
  "categories": ["lista", "de", "gêneros"],
  "published_date": "ano ou data de publicação original"
}}

Use null para campos que não souber com segurança. Não invente dados.
NÃO inclua o campo cover_url - será obtido de outra fonte.

Consulta: {query}
"""


async def _ask_anthropic(query: str) -> dict | None:
    if not settings.ANTHROPIC_API_KEY:
        return None
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    body = {
        "model": "claude-3-5-haiku-20241022",
        "max_tokens": 600,
        "messages": [{"role": "user", "content": PROMPT.format(query=query)}],
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    text = data["content"][0]["text"].strip()
    return _parse_json(text)


async def _ask_openai(query: str) -> dict | None:
    if not settings.OPENAI_API_KEY:
        return None
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "content-type": "application/json",
    }
    body = {
        "model": "gpt-4o-mini",
        "response_format": {"type": "json_object"},
        "messages": [{"role": "user", "content": PROMPT.format(query=query)}],
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
    text = data["choices"][0]["message"]["content"]
    return _parse_json(text)


def _parse_json(text: str) -> dict | None:
    # Remove cercas markdown caso a IA ignore a instrução
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip("` \n")
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning("IA retornou JSON inválido: %s", e)
        return None


async def ai_enrich(query: str) -> dict | None:
    """Tenta Claude primeiro, OpenAI depois. Retorna dict no formato do search_book."""
    for fn, name in ((_ask_anthropic, "anthropic"), (_ask_openai, "openai")):
        try:
            result = await fn(query)
            if result:
                result["sources"] = [f"ai_{name}"]
                # garante chaves esperadas
                result.setdefault("cover_url", None)
                result.setdefault("isbn", None)
                return result
        except Exception as e:
            logger.warning("Fallback IA (%s) falhou: %s", name, e)
    return None


def has_missing_fields(data: dict | None) -> bool:
    """Verifica se algum campo crítico está vazio."""
    if not data:
        return True
    return not (data.get("total_pages") and data.get("description") and data.get("author"))
