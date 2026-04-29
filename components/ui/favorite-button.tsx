"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites, type FavoriteItem } from "@/lib/favorites/context";

interface FavoriteButtonProps {
  product: FavoriteItem;
  /** "icon" = bare icon button (for product cards), "outline" = labeled outline button (for detail pages) */
  variant?: "icon" | "outline";
  className?: string;
}

export function FavoriteButton({
  product,
  variant = "outline",
  className,
}: FavoriteButtonProps) {
  const { isFavorited, toggle } = useFavorites();
  const favorited = isFavorited(product.slug);

  if (variant === "icon") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(product);
        }}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorited}
        className={`flex size-8 items-center justify-center bg-surface-container-high/80 transition-colors hover:bg-surface-container-highest ${className ?? ""}`}
      >
        <Heart
          className={`size-3.5 transition-colors ${
            favorited ? "fill-primary text-primary" : "text-muted-foreground"
          }`}
        />
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => toggle(product)}
      aria-pressed={favorited}
      className={`rounded-none uppercase font-bold border-border/30 text-foreground hover:bg-surface-container w-full justify-center gap-3 text-xs ${className ?? ""}`}
      style={{ letterSpacing: "0.12em" }}
    >
      <Heart
        className={`size-4 shrink-0 transition-colors ${
          favorited ? "fill-primary text-primary" : ""
        }`}
      />
      {favorited ? "SAVED TO FAVORITES" : "SAVE TO FAVORITES"}
    </Button>
  );
}
