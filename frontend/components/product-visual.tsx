import { tileFor } from "@/lib/category-style";
import { cn } from "@/lib/utils";

export function ProductVisual({
  emoji, slug, image, alt, className, size = "md",
}: {
  emoji: string; slug: string; image?: string | null; alt: string; className?: string; size?: "sm" | "md" | "lg";
}) {
  const text = size === "lg" ? "text-8xl" : size === "sm" ? "text-2xl" : "text-6xl";
  return (
    <div className={cn("flex items-center justify-center overflow-hidden", tileFor(slug), className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className={text} role="img" aria-label={alt}>{emoji}</span>
      )}
    </div>
  );
}
