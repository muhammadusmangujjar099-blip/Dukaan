"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/product-visual";
import { Rating } from "@/components/rating";
import { discountPct, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";

export function ProductCard({ product: p }: { product: Product }) {
  const add = useCart((s) => s.add);
  const off = discountPct(p.price, p.original_price);
  const soldOut = p.stock === 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link href={`/product/${p.id}`} className="relative block" aria-label={p.name}>
        <ProductVisual emoji={p.category.emoji} slug={p.category.slug} image={p.image_url} alt={p.name} className="aspect-[4/3]" />
        {off > 0 && <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">{off}% off</Badge>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-muted-foreground">{p.brand} · {p.category.name}</p>
        <Link href={`/product/${p.id}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug hover:underline">
          {p.name}
        </Link>
        <Rating value={p.rating} count={p.review_count} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-display text-lg font-bold leading-none">{formatPrice(p.price)}</p>
            {p.original_price && p.original_price > p.price && (
              <p className="mt-1 text-xs text-muted-foreground line-through">{formatPrice(p.original_price)}</p>
            )}
          </div>
          <Button
            size="sm"
            disabled={soldOut}
            onClick={() => {
              add(p, 1);
              toast.success(`${p.name} added to cart`);
            }}
            aria-label={`Add ${p.name} to cart`}
          >
            <ShoppingBag className="h-4 w-4" />
            {soldOut ? "Sold out" : "Add"}
          </Button>
        </div>
        {!soldOut && p.stock <= 5 && <p className="text-xs font-medium text-destructive">Only {p.stock} left</p>}
      </div>
    </article>
  );
}
