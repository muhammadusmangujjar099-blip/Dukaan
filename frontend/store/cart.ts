import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/types";

export type CartItem = {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  image_url: string | null;
  category_slug: string;
  emoji: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (p: Product, qty?: number) => number; // returns the quantity now in the cart
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1) => {
        const existing = get().items.find((i) => i.id === p.id);
        const next = Math.min((existing?.qty ?? 0) + qty, Math.min(p.stock, 20));
        if (existing) {
          set({ items: get().items.map((i) => (i.id === p.id ? { ...i, qty: next, stock: p.stock } : i)) });
        } else {
          set({
            items: [
              ...get().items,
              {
                id: p.id, name: p.name, brand: p.brand, price: p.price, stock: p.stock,
                image_url: p.image_url, category_slug: p.category.slug, emoji: p.category.emoji, qty: next,
              },
            ],
          });
        }
        return next;
      },
      setQty: (id, qty) =>
        set({
          items: get()
            .items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock, 20)) } : i)),
        }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: "dukaan-cart" }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.qty * i.price, 0);
