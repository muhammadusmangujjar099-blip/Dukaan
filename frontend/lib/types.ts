export type Category = { id: number; name: string; slug: string; emoji: string; product_count?: number };

export type Product = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  original_price: number | null;
  stock: number;
  rating: number;
  review_count: number;
  tags: string[];
  image_url: string | null;
  category: Category;
};

export type SortKey = "relevance" | "price_asc" | "price_desc" | "rating" | "newest";

export type Filters = {
  q?: string | null;
  category?: string | null;
  brand?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  min_rating?: number | null;
  in_stock?: boolean | null;
  sort?: SortKey;
};

export type ProductList = { items: Product[]; total: number; page: number; page_size: number; pages: number };

export type ChatResponse = {
  reply: string;
  intent: "search" | "chat";
  filters: Filters;
  products: Product[];
  total: number;
  source: "ai" | "fallback";
  model: string | null;
  relaxed: boolean;
};

export type OrderItem = { product_id: number; product_name: string; unit_price: number; quantity: number };

export type Order = {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
};

export type OrderInput = {
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  items: { product_id: number; quantity: number }[];
};
