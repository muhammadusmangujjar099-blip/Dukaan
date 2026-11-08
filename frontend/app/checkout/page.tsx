"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { formatPrice, shippingFor } from "@/lib/utils";
import { cartSubtotal, useCart } from "@/store/cart";

const FIELDS = [
  { name: "customer_name", label: "Full name", type: "text", autoComplete: "name", placeholder: "Ali Khan" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", placeholder: "03001234567" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "ali@example.com" },
  { name: "city", label: "City", type: "text", autoComplete: "address-level2", placeholder: "Islamabad" },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ customer_name: "", phone: "", email: "", city: "", address: "" });

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Link href="/#catalog" className={buttonVariants({ size: "lg", className: "mt-6" })}>Browse products</Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const order = await api.createOrder({
        ...form,
        items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
      });
      clear();
      toast.success("Order placed");
      router.push(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place the order.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.name} className="block text-sm font-medium">
                {f.label}
                <Input
                  required
                  type={f.type}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="mt-1.5"
                />
              </label>
            ))}
          </div>
          <label className="block text-sm font-medium">
            Delivery address
            <textarea
              required
              minLength={5}
              autoComplete="street-address"
              rows={3}
              placeholder="House, street, area"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1.5 w-full rounded-lg border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground"
            />
          </label>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <span className="font-semibold">Payment:</span> cash on delivery
          </div>
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Placing order…" : `Place order · ${formatPrice(subtotal + shipping)}`}
          </Button>
        </form>

        <aside className="h-fit space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-bold">Your items</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="line-clamp-1">{i.qty} × {i.name}</span>
                <span className="shrink-0">{formatPrice(i.qty * i.price)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t pt-3 text-sm"><span className="text-muted-foreground">Delivery</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
          <div className="flex justify-between font-display text-xl font-bold"><span>Total</span><span>{formatPrice(subtotal + shipping)}</span></div>
        </aside>
      </div>
    </div>
  );
}
