from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category, Product
from ..schemas import CategoryWithCount, ProductFilters, ProductList, ProductOut
from ..services.search import page_count, search_products

router = APIRouter(tags=["catalog"])


@router.get("/categories", response_model=list[CategoryWithCount])
def list_categories(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Category, func.count(Product.id))
        .outerjoin(Product, Product.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.id)
    ).all()
    return [
        CategoryWithCount(id=c.id, name=c.name, slug=c.slug, emoji=c.emoji, product_count=n)
        for c, n in rows
    ]


@router.get("/products", response_model=ProductList)
def list_products(
    q: str | None = Query(None, max_length=80),
    category: str | None = None,
    brand: str | None = None,
    min_price: int | None = Query(None, ge=0),
    max_price: int | None = Query(None, ge=0),
    min_rating: float | None = Query(None, ge=0, le=5),
    in_stock: bool | None = None,
    sort: Literal["relevance", "price_asc", "price_desc", "rating", "newest"] = "relevance",
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=48),
    db: Session = Depends(get_db),
):
    filters = ProductFilters(
        q=q, category=category, brand=brand, min_price=min_price, max_price=max_price,
        min_rating=min_rating, in_stock=in_stock, sort=sort,
    )
    items, total = search_products(db, filters, page, page_size)
    return ProductList(
        items=[ProductOut.model_validate(p) for p in items],
        total=total, page=page, page_size=page_size, pages=page_count(total, page_size),
    )


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    return ProductOut.model_validate(product)
