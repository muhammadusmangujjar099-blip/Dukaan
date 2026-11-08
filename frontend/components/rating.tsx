import { Star } from "lucide-react";

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
      <span className="font-semibold text-foreground">{value.toFixed(1)}</span>
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}
