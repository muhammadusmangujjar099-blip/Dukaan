"""Safe, parameterised product search.

Both the REST endpoint and the AI assistant go through `search_products`.
The AI only ever produces a `ProductFilters` object - it never writes SQL.
"""
import math

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, contains_eager

from ..models import Category, Product
from ..schemas import ProductFilters

STOPWORDS = {
    "the", "a", "an", "for", "and", "or", "with", "in", "of", "to", "me", "show",
    "best", "good", "ka", "ki", "ke", "ko", "se", "aur", "wala", "wali", "hai",
}


def _escape(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def tokenize(q: str | None) -> list[str]:
    if not q:
        return []
    out = []
    for raw in q.lower().replace(",", " ").split():
        if len(raw) < 2 or raw in STOPWORDS:
            continue
        # crude singularisation: "earbuds" -> "earbud", "laptops" -> "laptop"
        if len(raw) > 3 and raw.endswith("s") and not raw.endswith("ss"):
            raw = raw[:-1]
        out.append(raw)
    return out[:6]


def _conditions(f: ProductFilters) -> list:
    conds = []
    for tok in tokenize(f.q):
        like = f"%{_escape(tok)}%"
        conds.append(
            or_(
                Product.name.ilike(like, escape="\\"),
                Product.brand.ilike(like, escape="\\"),
                Product.tags.ilike(like, escape="\\"),
                Product.description.ilike(like, escape="\\"),
                Category.name.ilike(like, escape="\\"),
            )
        )
    if f.category:
        conds.append(Category.slug == f.category)
    if f.brand:
        conds.append(Product.brand.ilike(f"%{_escape(f.brand)}%", escape="\\"))
    if f.min_price is not None:
        conds.append(Product.price >= f.min_price)
    if f.max_price is not None:
        conds.append(Product.price <= f.max_price)
    if f.min_rating is not None:
        conds.append(Product.rating >= f.min_rating)
    if f.in_stock:
        conds.append(Product.stock > 0)
    return conds


def _order_by(sort: str):
    if sort == "price_asc":
        return [Product.price.asc(), Product.id.asc()]
    if sort == "price_desc":
        return [Product.price.desc(), Product.id.asc()]
    if sort == "rating":
        return [Product.rating.desc(), Product.review_count.desc(), Product.id.asc()]
    if sort == "newest":
        return [Product.created_at.desc(), Product.id.desc()]
    # relevance: well-rated and well-reviewed first
    return [Product.rating.desc(), Product.review_count.desc(), Product.id.asc()]


def search_products(
    db: Session, f: ProductFilters, page: int = 1, page_size: int = 12
) -> tuple[list[Product], int]:
    conds = _conditions(f)

    total = db.execute(
        select(func.count(Product.id)).select_from(Product).join(Category).where(*conds)
    ).scalar_one()

    stmt = (
        select(Product)
        .join(Category)
        .where(*conds)
        .options(contains_eager(Product.category))
        .order_by(*_order_by(f.sort))
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    items = list(db.execute(stmt).unique().scalars().all())
    return items, total


def page_count(total: int, page_size: int) -> int:
    return max(1, math.ceil(total / page_size))
