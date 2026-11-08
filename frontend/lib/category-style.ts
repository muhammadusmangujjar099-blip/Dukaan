// Full class names so Tailwind can see them.
export const categoryTile: Record<string, string> = {
  mobiles: "bg-teal-50",
  laptops: "bg-indigo-50",
  audio: "bg-rose-50",
  watches: "bg-amber-50",
  gaming: "bg-violet-50",
  home: "bg-emerald-50",
};
export const tileFor = (slug: string) => categoryTile[slug] ?? "bg-slate-100";
