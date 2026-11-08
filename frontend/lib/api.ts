import type { Category, ChatResponse, Filters, Order, OrderInput, Product, ProductList } from "./types";

const PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// On the server (inside Docker) the backend is reachable by its service name.
const BASE = typeof window === "undefined" ? process.env.API_INTERNAL_URL || PUBLIC_URL : PUBLIC_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      cache: "no-store",
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail) && body.detail[0]?.msg) message = body.detail[0].msg;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export type ProductQuery = Filters & { page?: number; page_size?: number };

export const api = {
  categories: () => request<Category[]>("/categories"),
  products: (query: ProductQuery = {}, signal?: AbortSignal) => {
    const p = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "" && v !== false) p.set(k, String(v));
    });
    return request<ProductList>(`/products?${p.toString()}`, { signal });
  },
  product: (id: number | string) => request<Product>(`/products/${id}`),
  createOrder: (body: OrderInput) => request<Order>("/orders", { method: "POST", body: JSON.stringify(body) }),
  order: (id: number | string) => request<Order>(`/orders/${id}`),
  chat: (body: { messages: { role: string; content: string }[]; context_filters?: Filters | null }) =>
    request<ChatResponse>("/chat", { method: "POST", body: JSON.stringify(body) }),
};
