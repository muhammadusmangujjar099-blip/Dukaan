"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Sparkles } from "lucide-react";
import { cartCount, useCart } from "@/store/cart";
import { useChat } from "@/store/chat";

export function Navbar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const count = useCart((s) => cartCount(s.items));
  const setOpen = useChat((s) => s.setOpen);

  useEffect(() => setMounted(true), []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const value = q.trim();
    router.push(value ? `/?q=${encodeURIComponent(value)}#catalog` : "/#catalog");
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Dukaan home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold">Dukaan</span>
        </Link>

        <form onSubmit={onSearch} className="relative ml-2 hidden max-w-md flex-1 sm:block" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search phones, laptops, earbuds…"
            aria-label="Search products"
            className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground"
          />
        </form>

        <nav className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-semibold hover:bg-muted"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Ask the assistant</span>
          </button>
          <Link
            href="/cart"
            className="relative inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            aria-label={`Cart, ${mounted ? count : 0} items`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {mounted && count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
