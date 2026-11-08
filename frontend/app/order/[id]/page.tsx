"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.order(id).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-2xl font-bold">Order not found</h1><p className="mt-2 text-muted-foreground">{error}</p></div>;
  if (!order) return <div className="mx-auto max-w-2xl space-y-4 px-4 py-16"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-48" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="flex items-start gap-4">
        <CheckCircle2 className="mt-1 h-10 w-10 shrink-0 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id} is confirmed</h1>
          <p className="mt-2 text-muted-foreground">
            We’ll deliver to {order.address}, {order.city}. Keep {formatPrice(order.total)} ready in cash.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-card p-5">
        <ul className="space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={i.product_id} className="flex justify-between gap-3">
              <span>{i.quantity} × {i.product_name}</span>
              <span>{formatPrice(i.quantity * i.unit_price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{order.shipping_fee === 0 ? "Free" : formatPrice(order.shipping_fee)}</span></div>
          <div className="flex justify-between pt-2 font-display text-xl font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      <Link href="/" className={buttonVariants({ size: "lg", className: "mt-8" })}>Continue shopping</Link>
    </div>
  );
}
