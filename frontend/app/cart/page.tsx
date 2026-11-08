"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductVisual } from "@/components/product-visual";
import { FREE_SHIPPING_FROM, formatPrice, shippingFor } from "@/lib/utils";
import { cartSubtotal, useCart } from "@/store/cart";

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">Add something you like, or tell the assistant your budget.</p>
        <Link href="/#catalog" className={buttonVariants({ size: "lg" })}>Browse products</Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const toFree = FREE_SHIPPING_FROM - subtotal;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex gap-4 rounded-xl border bg-card p-3">
              <ProductVisual emoji={i.emoji} slug={i.category_slug} image={i.image_url} alt="" size="sm" className="h-24 w-24 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/product/${i.id}`} className="line-clamp-2 font-semibold hover:underline">{i.name}</Link>
                <p className="text-sm text-muted-foreground">{i.brand}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex h-9 items-center rounded-lg border">
                    <button className="flex h-9 w-9 items-center justify-center disabled:opacity-40" onClick={() => setQty(i.id, i.qty - 1)} disabled={i.qty <= 1} aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                    <span className="w-7 text-center text-sm font-semibold">{i.qty}</span>
                    <button className="flex h-9 w-9 items-center justify-center disabled:opacity-40" onClick={() => setQty(i.id, i.qty + 1)} disabled={i.qty >= Math.min(i.stock, 20)} aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
                  </div>
                  <p className="font-display text-lg font-bold">{formatPrice(i.price * i.qty)}</p>
                </div>
              </div>
              <button onClick={() => remove(i.id)} className="self-start rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Remove ${i.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
          {toFree > 0 && <p className="text-xs text-muted-foreground">Add {formatPrice(toFree)} more for free delivery.</p>}
          <div className="flex justify-between border-t pt-3 font-display text-xl font-bold"><span>Total</span><span>{formatPrice(subtotal + shipping)}</span></div>
          <Link href="/checkout" className={buttonVariants({ size: "lg", className: "w-full" })}>Checkout</Link>
          <p className="text-center text-xs text-muted-foreground">Pay cash on delivery</p>
        </aside>
      </div>
    </div>
  );
}
