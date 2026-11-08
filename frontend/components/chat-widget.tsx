"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { ProductVisual } from "@/components/product-visual";
import { Rating } from "@/components/rating";
import { filtersToHref, formatPrice } from "@/lib/utils";
import type { Filters, Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { useChat, type ChatMsg } from "@/store/chat";

const SUGGESTIONS = ["Phone under 20,000", "Laptop 1 lakh se kam", "Cheapest earbuds", "Air fryer under 25k"];

function describeFilters(f: Filters) {
  const parts: string[] = [];
  if (f.category) parts.push(f.category);
  if (f.brand) parts.push(f.brand);
  if (f.q) parts.push(`“${f.q}”`);
  if (f.min_price != null) parts.push(`≥ ${formatPrice(f.min_price)}`);
  if (f.max_price != null) parts.push(`≤ ${formatPrice(f.max_price)}`);
  if (f.sort && f.sort !== "relevance") parts.push(f.sort.replace("_", " "));
  return parts.join(" · ");
}

function MiniProduct({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  const setOpen = useChat((s) => s.setOpen);
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-2">
      <ProductVisual emoji={p.category.emoji} slug={p.category.slug} image={p.image_url} alt="" size="sm" className="h-14 w-14 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <Link href={`/product/${p.id}`} onClick={() => setOpen(false)} className="line-clamp-1 text-sm font-semibold hover:underline">
          {p.name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{formatPrice(p.price)}</span>
          <Rating value={p.rating} />
        </div>
      </div>
      <button
        disabled={p.stock === 0}
        onClick={() => { add(p, 1); toast.success(`${p.name} added to cart`); }}
        className="h-8 shrink-0 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {p.stock === 0 ? "Sold out" : "Add"}
      </button>
    </div>
  );
}

function Bubble({ m }: { m: ChatMsg }) {
  const setOpen = useChat((s) => s.setOpen);
  const mine = m.role === "user";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className={mine ? "max-w-[85%]" : "w-full max-w-[95%]"}>
        <div
          className={
            mine
              ? "rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
              : "rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm leading-relaxed"
          }
        >
          {m.content}
        </div>
        {m.products && m.products.length > 0 && (
          <div className="mt-2 space-y-2">
            {m.filters && describeFilters(m.filters) && (
              <p className="px-1 text-xs text-muted-foreground">Filters: {describeFilters(m.filters)}</p>
            )}
            {m.products.map((p) => <MiniProduct key={p.id} p={p} />)}
            {m.total !== undefined && m.filters && (
              <Link
                href={filtersToHref(m.filters)}
                onClick={() => setOpen(false)}
                className="block rounded-lg border bg-card py-2 text-center text-sm font-semibold text-primary hover:bg-muted"
              >
                See all {m.total} in the store
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatWidget() {
  const { open, setOpen, messages, loading, send, reset } = useChat();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = text;
    setText("");
    void send(value);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
          aria-label="Open shopping assistant"
        >
          <Sparkles className="h-5 w-5" />
          Ask the assistant
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="Shopping assistant"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,calc(100dvh-1.5rem))] animate-chat-in flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[390px]"
        >
          <header className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-display text-base font-bold leading-tight">Dukaan assistant</p>
              <p className="text-xs text-primary-foreground/75">Searches the live catalogue</p>
            </div>
            <button onClick={reset} className="rounded-md p-2 hover:bg-white/10" aria-label="Start a new chat" title="New chat">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-white/10" aria-label="Close assistant">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin" aria-live="polite">
            {messages.map((m) => <Bubble key={m.id} m={m} />)}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => void send(s)} className="rounded-full border bg-background px-3 py-1.5 text-xs hover:bg-muted">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex" aria-label="Assistant is typing">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 animate-dot rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t p-3">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. samsung phone 40 hazar tak"
              maxLength={300}
              aria-label="Message"
              className="h-11 flex-1 rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              aria-label="Send"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
