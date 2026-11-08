"""AI shopping assistant.

Flow:
  1. LLM (OpenRouter, free model) turns the chat into a JSON *filter object*.
  2. We validate it with Pydantic, cross-check prices with rules, and run a
     parameterised SQLAlchemy query. The LLM never writes SQL.
  3. A second short LLM call writes a friendly reply about the real results.
If OpenRouter is down / no key is set, a rule-based parser takes over.
"""
import json
import logging
import re

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Category, Product
from ..schemas import ChatRequest, ChatResponse, ProductFilters, ProductOut
from . import heuristics
from .search import search_products

log = logging.getLogger("assistant")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
RESULT_LIMIT = 6


class AIUnavailable(Exception):
    pass


# --------------------------------------------------------------- OpenRouter
def call_openrouter(messages: list[dict], max_tokens: int = 500) -> tuple[str, str]:
    if not settings.openrouter_api_key:
        raise AIUnavailable("OPENROUTER_API_KEY is not set")

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.site_url,  # optional, shows up on OpenRouter rankings
        "X-Title": settings.site_name,
    }
    for model in settings.openrouter_models:
        try:
            r = httpx.post(
                OPENROUTER_URL,
                headers=headers,
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": max_tokens,
                },
                timeout=30,
            )
            if r.status_code != 200:
                log.warning("OpenRouter %s -> HTTP %s %s", model, r.status_code, r.text[:200])
                continue
            content = (r.json()["choices"][0]["message"].get("content") or "").strip()
            if content:
                return content, model
        except Exception as exc:  # network, JSON, missing keys...
            log.warning("OpenRouter %s failed: %s", model, exc)
    raise AIUnavailable("all configured models failed")


def extract_json(text: str) -> dict:
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("no JSON object in model output")
    return json.loads(text[start : end + 1])


# ------------------------------------------------------------------ prompts
def parser_prompt(slugs: list[str], brands: list[str], prev: ProductFilters | None) -> str:
    prev_json = prev.model_dump(exclude_none=True) if prev else "none"
    return f"""You are the query parser of an online store in Pakistan. Prices are in PKR (Rs).
You understand English, Urdu and Roman Urdu ("20 hazar" = 20000, "1 lakh" = 100000, "sasta" = cheap, "andar"/"tak"/"se kam" = maximum).

Return ONLY one JSON object, no markdown, no explanation:
{{"intent":"search"|"chat","filters":{{"q":string|null,"category":string|null,"brand":string|null,"min_price":integer|null,"max_price":integer|null,"min_rating":number|null,"in_stock":boolean|null,"sort":"relevance"|"price_asc"|"price_desc"|"rating"|"newest"}},"reply":string}}

Rules:
- intent "search": the customer wants to find, compare or get recommendations for products. Otherwise "chat" and put a short helpful answer in "reply".
- category must be one of {slugs} or null.
- brand must be one of {brands} or null.
- q: only short extra keywords such as "gaming", "5000mah", "air fryer". Never repeat the category or the price. null if nothing specific.
- Follow-ups like "isse sasta dikhao", "only samsung", "under 15k instead" refine the previous filters, which were: {prev_json}
- Never invent products. For "search" the "reply" can be an empty string."""


SUMMARY_PROMPT = """You are a friendly sales assistant for Dukaan, an online store in Pakistan.
Reply in the same language and style as the customer (English, Urdu or Roman Urdu).
Maximum 3 short sentences, plain text, no markdown, no emojis.
Mention at most 3 products from the list by exact name and price in Rs. Only use the products provided.
If the list is empty, say nothing matched and suggest changing the budget or filters.
If "relaxed" is true, say you widened the search a little to find these."""


# ----------------------------------------------------------------- helpers
def _catalog_facts(db: Session) -> tuple[list[str], list[str]]:
    slugs = list(db.execute(select(Category.slug)).scalars())
    brands = sorted(set(db.execute(select(Product.brand)).scalars()))
    return slugs, brands


def sanitize_filters(raw: dict, slugs: list[str], brands: list[str]) -> ProductFilters:
    data = {k: v for k, v in (raw or {}).items() if v not in (None, "", [])}
    if data.get("category") not in slugs:
        data.pop("category", None)
    if "brand" in data:
        match = next((b for b in brands if b.lower() == str(data["brand"]).lower()), None)
        if match:
            data["brand"] = match
        else:
            data.pop("brand")
    try:
        return ProductFilters.model_validate(data)
    except Exception:
        safe = {k: data[k] for k in ("category", "brand", "sort") if k in data}
        return ProductFilters.model_validate(safe)


def _fallback_reply(products: list[Product], total: int, f: ProductFilters) -> str:
    if not products:
        return "I couldn't find anything for that. Try a higher budget or fewer filters."
    budget = f" under Rs {f.max_price:,}" if f.max_price else ""
    top = products[0]
    return (
        f"I found {total} option{'s' if total != 1 else ''}{budget}. "
        f"Top pick: {top.name} at Rs {top.price:,} ({top.rating:.1f}★)."
    )


def _write_reply(user_text: str, f: ProductFilters, products: list[Product], relaxed: bool):
    payload = {
        "customer_message": user_text,
        "filters": f.model_dump(exclude_none=True),
        "relaxed": relaxed,
        "products": [
            {"name": p.name, "brand": p.brand, "price_rs": p.price,
             "rating": p.rating, "in_stock": p.stock > 0}
            for p in products[:5]
        ],
    }
    text, model = call_openrouter(
        [
            {"role": "system", "content": SUMMARY_PROMPT},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        max_tokens=220,
    )
    return text.strip().strip('"'), model


# -------------------------------------------------------------- main entry
def handle_chat(db: Session, req: ChatRequest) -> ChatResponse:
    slugs, brands = _catalog_facts(db)
    user_text = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    history = [m.model_dump() for m in req.messages[-8:]]
    rule = heuristics.parse_query(user_text, set(slugs), brands)

    intent, raw_filters, llm_reply, model, source = "search", {}, "", None, "fallback"
    try:
        content, model = call_openrouter(
            [{"role": "system", "content": parser_prompt(slugs, brands, req.context_filters)}]
            + history
        )
        parsed = extract_json(content)
        intent = "chat" if parsed.get("intent") == "chat" else "search"
        raw_filters = parsed.get("filters") or {}
        llm_reply = (parsed.get("reply") or "").strip()
        source = "ai"
    except (AIUnavailable, ValueError, KeyError, json.JSONDecodeError) as exc:
        log.info("falling back to rule-based parser: %s", exc)
        raw_filters = dict(req.context_filters.model_dump(exclude_none=True)) if req.context_filters else {}
        # without an LLM, treat messages that contain any shopping signal as searches
        if not rule and not heuristics.extract_category(user_text):
            intent = "search" if len(user_text.split()) <= 6 else "chat"

    # explicit numbers/categories found by rules win over the LLM's guess
    for key in ("min_price", "max_price", "sort", "brand", "in_stock"):
        if key in rule:
            raw_filters[key] = rule[key]
    if "category" in rule and not raw_filters.get("category"):
        raw_filters["category"] = rule["category"]
    if source == "fallback" and not rule and user_text:
        raw_filters.setdefault("q", " ".join(heuristics_tokens(user_text)) or None)

    filters = sanitize_filters(raw_filters, slugs, brands)

    if intent == "chat" and source == "ai":
        return ChatResponse(
            reply=llm_reply or "Tell me what you're looking for and your budget, and I'll find it.",
            intent="chat", filters=req.context_filters or ProductFilters(),
            products=[], total=0, source=source, model=model,
        )

    products, total = search_products(db, filters, page=1, page_size=RESULT_LIMIT)
    relaxed = False
    has_other = any(
        v is not None for v in (filters.category, filters.brand, filters.min_price, filters.max_price)
    )
    if total == 0 and filters.q and has_other:  # relax: drop free-text keywords first
        relaxed_filters = filters.model_copy(update={"q": None})
        products, total = search_products(db, relaxed_filters, page=1, page_size=RESULT_LIMIT)
        if total:
            filters, relaxed = relaxed_filters, True

    reply = _fallback_reply(products, total, filters)
    if source == "ai":
        try:
            reply, model = _write_reply(user_text, filters, products, relaxed)
        except (AIUnavailable, Exception) as exc:  # keep the template reply
            log.info("summary call failed: %s", exc)

    return ChatResponse(
        reply=reply, intent="search", filters=filters,
        products=[ProductOut.model_validate(p) for p in products],
        total=total, source=source, model=model, relaxed=relaxed,
    )


def heuristics_tokens(text: str) -> list[str]:
    from .search import tokenize
    return tokenize(text)
