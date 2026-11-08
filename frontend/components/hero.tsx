"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { tileFor } from "@/lib/category-style";
import type { Category } from "@/lib/types";
import { useChat } from "@/store/chat";

const EXAMPLES = [
  "Best phone under 20,000",
  "Laptop 1 lakh se kam",
  "Earbuds with noise cancelling under 10k",
  "Gift for a gamer around 15,000",
];

export function Hero({ categories }: { categories: Category[] }) {
  const send = useChat((s) => s.send);
  const [text, setText] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    void send(text);
    setText("");
  }

  return (
    <section className="border-b bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:py-16">
        <div>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            Tell us your budget. We’ll find the right one.
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground">
            Type what you need in English, Urdu or Roman Urdu. The assistant searches the live catalogue and shows
            only what fits your price.
          </p>

          <form onSubmit={submit} className="mt-7 max-w-xl">
            <div className="flex items-center gap-2 rounded-xl border bg-background p-2 pl-4 focus-within:ring-2 focus-within:ring-ring">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. 20 hazar ke andar achha mobile"
                aria-label="Describe what you want to buy"
                className="h-10 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                aria-label="Ask the assistant"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="mt-4 flex max-w-xl flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => void send(ex)}
                className="rounded-full border bg-background px-3 py-1.5 text-sm hover:bg-muted"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 content-start gap-3 self-center">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?category=${c.slug}#catalog`}
              className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border text-center transition-colors hover:border-primary ${tileFor(c.slug)}`}
            >
              <span className="text-4xl" aria-hidden>{c.emoji}</span>
              <span className="px-1 text-sm font-semibold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
