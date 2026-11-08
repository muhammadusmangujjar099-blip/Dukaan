"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product-card";
import { api } from "@/lib/api";
import type { Category, Product, SortKey } from "@/lib/types";
import { cn } from "@/lib/utils";

type State = {
  q: string; category: string; brand: string; min: string; max: string; sort: SortKey; inStock: boolean;
};

const EMPTY: State = { q: "", category: "", brand: "", min: "", max: "", sort: "relevance", inStock: false };
const PAGE_SIZE = 12;

function fromParams(sp: URLSearchParams): State {
  const sort = sp.get("sort") as SortKey | null;
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    brand: sp.get("brand") ?? "",
    min: sp.get("min_price") ?? "",
    max: sp.get("max_price") ?? "",
    sort: sort && ["price_asc", "price_desc", "rating", "newest"].includes(sort) ? sort : "relevance",
    inStock: sp.get("in_stock") === "1",
  };
}

export function Catalog({ categories }: { categories: Category[] }) {
  const sp = useSearchParams();
  const [state, setState] = useState<State>(() => fromParams(sp));
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  // URL changes (navbar search, hero tiles, assistant "see all") -> reset filters
  const spKey = sp.toString();
  useEffect(() => setState(fromParams(sp)), [spKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async (s: State, p: number, append: boolean) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await api.products(
        {
          q: s.q || null, category: s.category || null, brand: s.brand || null,
          min_price: s.min ? Number(s.min) : null, max_price: s.max ? Number(s.max) : null,
          in_stock: s.inStock, sort: s.sort, page: p, page_size: PAGE_SIZE,
        },
        ctrl.signal
      );
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
      setTotal(res.total);
      setPages(res.pages);
      setPage(res.page);
      setLoading(false);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load products");
      setLoading(false);
    }
  }, []);

  // debounce filter edits
  useEffect(() => {
    const t = setTimeout(() => void load(state, 1, false), 250);
    return () => clearTimeout(t);
  }, [state, load]);

  const set = <K extends keyof State>(key: K, value: State[K]) => setState((s) => ({ ...s, [key]: value }));
  const dirty = JSON.stringify(state) !== JSON.stringify(EMPTY);

  return (
    <section id="catalog" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold sm:text-3xl">Shop all products</h2>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading && items.length === 0 ? "Loading…" : `${total} product${total === 1 ? "" : "s"}`}
        </p>
      </div>

      {/* category pills */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[{ id: 0, slug: "", name: "All", emoji: "🛍️" } as Category, ...categories].map((c) => (
          <button
            key={c.id}
            onClick={() => set("category", c.slug)}
            aria-pressed={state.category === c.slug}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
              state.category === c.slug ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            )}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </div>

      {/* filters */}
      <div className="mt-4 grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto_auto]">
        <Input value={state.q} onChange={(e) => set("q", e.target.value)} placeholder="Search by name, brand or feature" aria-label="Search" />
        <Input type="number" min={0} inputMode="numeric" value={state.min} onChange={(e) => set("min", e.target.value)} placeholder="Min price (Rs)" aria-label="Minimum price" />
        <Input type="number" min={0} inputMode="numeric" value={state.max} onChange={(e) => set("max", e.target.value)} placeholder="Max price (Rs)" aria-label="Maximum price" />
        <select
          value={state.sort}
          onChange={(e) => set("sort", e.target.value as SortKey)}
          aria-label="Sort by"
          className="h-10 rounded-lg border bg-card px-3 text-sm"
        >
          <option value="relevance">Top picks</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Highest rated</option>
          <option value="newest">Newest</option>
        </select>
        <label className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
          <input type="checkbox" checked={state.inStock} onChange={(e) => set("inStock", e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
          In stock
        </label>
        {dirty && (
          <Button variant="ghost" onClick={() => setState(EMPTY)}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold">Couldn’t load products</p>
          <p className="mt-1 text-muted-foreground">{error}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => void load(state, 1, false)}>Try again</Button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
        {loading && items.length === 0 && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
      </div>

      {!loading && !error && items.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <PackageSearch className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">No products match these filters</p>
          <p className="text-sm text-muted-foreground">Try a higher budget, or ask the assistant to suggest alternatives.</p>
          <Button variant="outline" onClick={() => setState(EMPTY)}>Clear filters</Button>
        </div>
      )}

      {page < pages && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" size="lg" disabled={loading} onClick={() => void load(state, page + 1, true)}>
            {loading ? "Loading…" : "Show more"}
          </Button>
        </div>
      )}
    </section>
  );
}
