import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { Hero } from "@/components/hero";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let categories: Category[] = [];
  try {
    categories = await api.categories();
  } catch {
    // Catalog shows its own error state if the API is down.
  }
  return (
    <>
      <Hero categories={categories} />
      <Suspense fallback={null}>
        <Catalog categories={categories} />
      </Suspense>
    </>
  );
}
