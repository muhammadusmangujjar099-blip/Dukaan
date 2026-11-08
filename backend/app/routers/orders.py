from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Order, OrderItem, Product
from ..schemas import OrderCreate, OrderOut

router = APIRouter(tags=["orders"])


def shipping_for(subtotal: int) -> int:
    return 0 if subtotal >= settings.free_shipping_threshold else settings.shipping_fee


@router.post("/orders", response_model=OrderOut, status_code=201)
def place_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # merge duplicate lines, then trust only server-side prices
    wanted: dict[int, int] = defaultdict(int)
    for line in payload.items:
        wanted[line.product_id] += line.quantity

    # lock rows so two buyers can't oversell the last unit
    products = {
        p.id: p
        for p in db.execute(
            select(Product).where(Product.id.in_(wanted)).with_for_update(of=Product)
        ).unique().scalars()
    }

    for pid, qty in wanted.items():
        product = products.get(pid)
        if not product:
            raise HTTPException(400, f"Product {pid} no longer exists")
        if product.stock < qty:
            raise HTTPException(
                409, f"Only {product.stock} left of {product.name}" if product.stock else f"{product.name} is out of stock"
            )

    subtotal = sum(products[pid].price * qty for pid, qty in wanted.items())
    shipping = shipping_for(subtotal)

    order = Order(
        customer_name=payload.customer_name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip(),
        address=payload.address.strip(),
        city=payload.city.strip(),
        subtotal=subtotal,
        shipping_fee=shipping,
        total=subtotal + shipping,
        items=[
            OrderItem(
                product_id=pid,
                product_name=products[pid].name,
                unit_price=products[pid].price,
                quantity=qty,
            )
            for pid, qty in wanted.items()
        ],
    )
    for pid, qty in wanted.items():
        products[pid].stock -= qty

    db.add(order)
    db.commit()
    db.refresh(order)
    return OrderOut.model_validate(order)


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return OrderOut.model_validate(order)
