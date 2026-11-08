import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

SortKey = Literal["relevance", "price_asc", "price_desc", "rating", "newest"]


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    emoji: str


class CategoryWithCount(CategoryOut):
    product_count: int = 0


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    brand: str
    description: str
    price: int
    original_price: int | None = None
    stock: int
    rating: float
    review_count: int
    tags: list[str] = []
    image_url: str | None = None
    category: CategoryOut

    @field_validator("tags", mode="before")
    @classmethod
    def split_tags(cls, v):
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        return v


class ProductList(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
    pages: int


class ProductFilters(BaseModel):
    """Validated filter set. Used by the REST API *and* by the AI assistant,
    so the LLM can never produce anything the database layer doesn't allow."""

    q: str | None = Field(default=None, max_length=80)
    category: str | None = None
    brand: str | None = None
    min_price: int | None = Field(default=None, ge=0, le=100_000_000)
    max_price: int | None = Field(default=None, ge=0, le=100_000_000)
    min_rating: float | None = Field(default=None, ge=0, le=5)
    in_stock: bool | None = None
    sort: SortKey = "relevance"

    @field_validator("min_price", "max_price", mode="before")
    @classmethod
    def clean_price(cls, v):
        if isinstance(v, str):
            digits = re.sub(r"[^\d.]", "", v)
            return int(float(digits)) if digits else None
        if isinstance(v, float):
            return int(v)
        return v

    @field_validator("q", "category", "brand", mode="before")
    @classmethod
    def blank_to_none(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v

    @model_validator(mode="after")
    def order_prices(self):
        if (
            self.min_price is not None
            and self.max_price is not None
            and self.min_price > self.max_price
        ):
            self.min_price, self.max_price = self.max_price, self.min_price
        return self


# ---------------------------------------------------------------- orders
class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=20)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=160)
    phone: str = Field(min_length=10, max_length=30)
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=80)
    items: list[OrderItemIn] = Field(min_length=1, max_length=30)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    product_name: str
    unit_price: int
    quantity: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_name: str
    email: str
    phone: str
    address: str
    city: str
    subtotal: int
    shipping_fee: int
    total: int
    status: str
    payment_method: str
    created_at: datetime
    items: list[OrderItemOut]


# ------------------------------------------------------------------ chat
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=1000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    context_filters: ProductFilters | None = None


class ChatResponse(BaseModel):
    reply: str
    intent: Literal["search", "chat"]
    filters: ProductFilters
    products: list[ProductOut]
    total: int
    source: Literal["ai", "fallback"]
    model: str | None = None
    relaxed: bool = False
