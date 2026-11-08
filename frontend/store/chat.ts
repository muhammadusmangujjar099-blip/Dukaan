import { create } from "zustand";
import { api } from "@/lib/api";
import type { Filters, Product } from "@/lib/types";

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  total?: number;
  filters?: Filters;
  source?: "ai" | "fallback";
};

type ChatState = {
  open: boolean;
  loading: boolean;
  messages: ChatMsg[];
  lastFilters: Filters | null;
  setOpen: (open: boolean) => void;
  send: (text: string) => Promise<void>;
  reset: () => void;
};

const WELCOME: ChatMsg = {
  id: "welcome",
  role: "assistant",
  content: "Salam! Tell me what you need and your budget. For example: “phone under 20,000” or “laptop 1 lakh se kam”.",
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useChat = create<ChatState>((set, get) => ({
  open: false,
  loading: false,
  messages: [WELCOME],
  lastFilters: null,
  setOpen: (open) => set({ open }),
  reset: () => set({ messages: [WELCOME], lastFilters: null }),
  send: async (text) => {
    const content = text.trim();
    if (!content || get().loading) return;

    const userMsg: ChatMsg = { id: uid(), role: "user", content };
    set({ open: true, loading: true, messages: [...get().messages, userMsg] });

    const history = get()
      .messages.filter((m) => m.id !== "welcome")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await api.chat({ messages: history, context_filters: get().lastFilters });
      const reply: ChatMsg = {
        id: uid(), role: "assistant", content: res.reply,
        products: res.products, total: res.total, filters: res.filters, source: res.source,
      };
      set({
        messages: [...get().messages, reply],
        lastFilters: res.intent === "search" ? res.filters : get().lastFilters,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      set({ messages: [...get().messages, { id: uid(), role: "assistant", content: `Sorry, I couldn't search just now. ${message}` }] });
    } finally {
      set({ loading: false });
    }
  },
}));
