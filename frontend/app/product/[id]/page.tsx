import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Truck, Wallet } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { ProductVisual } from "@/components/product-visual";
import { Rating } from "@/components/rating";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import type { Product } from "@/lib/types";
import { discountPct, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { id: string } }) {
  let product: Product;
  try {
    product = await api.product(params.id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const related = await api
    .products({ category: product.category.slug, page_size: 5 })
    .then((r) => r.items.filter((p) => p.id !== product.id).slice(0, 4))
    .catch(() => []);
  const off = discountPct(product.price, product.original_price);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/?category=${product.category.slug}#catalog`} className="hover:underline">{product.category.name}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductVisual
          emoji={product.category.emoji} slug={product.category.slug} image={product.image_url}
          alt={product.name} size="lg" className="aspect-square rounded-2xl border lg:aspect-[5/4]"
        />

        <div>
          <p className="text-sm text-muted-foreground">{product.brand}</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight">{product.name}</h1>
          <div className="mt-3"><Rating value={product.rating} count={product.review_count} /></div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl font-bold">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                <Badge className="bg-accent text-accent-foreground">Save {off}%</Badge>
              </>
            )}
          </div>

          <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags.map((t) => <Badge key={t} className="bg-muted text-muted-foreground">{t}</Badge>)}
          </div>

          <p className="mt-5 text-sm font-medium">
            {product.stock === 0 ? (
              <span className="text-destructive">Out of stock</span>
            ) : product.stock <= 5 ? (
              <span className="text-destructive">Only {product.stock} left</span>
            ) : (
              <span className="text-primary">In stock</span>
            )}
          </p>

          <div className="mt-5"><AddToCart product={product} /></div>

          <ul className="mt-8 space-y-3 rounded-xl border bg-card p-4 text-sm">
            <li className="flex items-center gap-3"><Truck className="h-5 w-5 text-primary" /> Free delivery over Rs 5,000, otherwise Rs 250</li>
            <li className="flex items-center gap-3"><Wallet className="h-5 w-5 text-primary" /> Pay cash on delivery</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-bold">More in {product.category.name}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
