import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Filters } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 1250000 -> "Rs 1,250,000" (same output on server and client) */
export function formatPrice(n: number) {
  return `Rs ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function discountPct(price: number, original: number | null) {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export const FREE_SHIPPING_FROM = 5000;
export const SHIPPING_FEE = 250;
export const shippingFor = (subtotal: number) => (subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FEE);

/** Turn assistant filters into a store URL so "see all results" opens the same search. */
export function filtersToHref(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  if (f.brand) p.set("brand", f.brand);
  if (f.min_price != null) p.set("min_price", String(f.min_price));
  if (f.max_price != null) p.set("max_price", String(f.max_price));
  if (f.in_stock) p.set("in_stock", "1");
  if (f.sort && f.sort !== "relevance") p.set("sort", f.sort);
  const qs = p.toString();
  return `/${qs ? `?${qs}` : ""}#catalog`;
}
