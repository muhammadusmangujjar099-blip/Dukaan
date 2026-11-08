from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    emoji: Mapped[str] = mapped_column(String(8), default="🛍️")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (Index("ix_products_price", "price"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    brand: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[int] = mapped_column(Integer)  # PKR, whole rupees
    original_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[str] = mapped_column(String(255), default="")
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    category: Mapped[Category] = relationship(lazy="joined")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160))
    phone: Mapped[str] = mapped_column(String(30))
    address: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(String(80))
    subtotal: Mapped[int] = mapped_column(Integer)
    shipping_fee: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    payment_method: Mapped[str] = mapped_column(String(20), default="cod")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    product_name: Mapped[str] = mapped_column(String(160))
    unit_price: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[int] = mapped_column(Integer)

    order: Mapped[Order] = relationship(back_populates="items")
