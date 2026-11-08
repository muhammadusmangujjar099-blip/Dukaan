"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";

export function AddToCart({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const router = useRouter();
  const max = Math.min(product.stock, 20);

  if (product.stock === 0) return <Button disabled size="lg">Sold out</Button>;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-12 items-center rounded-lg border bg-card">
        <button className="flex h-12 w-11 items-center justify-center disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
        <button className="flex h-12 w-11 items-center justify-center disabled:opacity-40" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Increase quantity">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button size="lg" onClick={() => { add(product, qty); toast.success("Added to cart"); }}>
        <ShoppingBag className="h-5 w-5" /> Add to cart
      </Button>
      <Button size="lg" variant="accent" onClick={() => { add(product, qty); router.push("/cart"); }}>
        Buy now
      </Button>
    </div>
  );
}
