"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { useFavorites } from "@/lib/favorites/context";
import { getAllProducts } from "@/lib/data/index";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function getProductHref(category: string, slug: string): string {
  return `/${category === "part" ? "parts" : category + "s"}/${slug}`;
}

export default function FavoritesPage() {
  const { favorites, remove } = useFavorites();

  // Look up full product data to get spec lines for each favorite
  const allProducts = getAllProducts();
  const products = favorites
    .map((fav) => allProducts.find((p) => p.slug === fav.slug))
    .filter((p) => p !== undefined);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-1"
            style={{ letterSpacing: "0.18em" }}
          >
            OPERATOR PORTAL
          </p>
          <h2
            className="font-display text-2xl font-bold uppercase text-foreground"
            style={{ letterSpacing: "-0.02em" }}
          >
            SAVED ITEMS
          </h2>
        </div>
        {favorites.length > 0 && (
          <span
            className="text-[10px] uppercase text-muted-foreground/50 shrink-0"
            style={{ letterSpacing: "0.1em" }}
          >
            {favorites.length} ITEM{favorites.length !== 1 ? "S" : ""}
          </span>
        )}
      </div>

      {/* Empty state */}
      {favorites.length === 0 ? (
        <div className="bg-surface-container-low flex flex-col items-center justify-center gap-5 py-24 text-center">
          <Heart className="size-10 text-muted-foreground/20" />
          <div>
            <p
              className="font-display text-sm font-bold uppercase text-foreground mb-1"
              style={{ letterSpacing: "0.04em" }}
            >
              NO SAVED ITEMS
            </p>
            <p className="text-xs text-muted-foreground">
              Heart any firearm, part, or apparel to save it here.
            </p>
          </div>
          <Button
            asChild
            className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-[10px] gap-2 mt-1"
            style={{ letterSpacing: "0.12em" }}
          >
            <Link href="/firearms">
              BROWSE FIREARMS
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      ) : (
        /* Favorites grid */
        <div className="grid grid-cols-1 gap-px bg-border/10 sm:grid-cols-2">
          {products.map((product) => {
            if (!product) return null;
            const href = getProductHref(product.category, product.slug);
            return (
              <div
                key={product.slug}
                className="group relative flex gap-4 bg-surface-container-low p-4 hover:bg-surface-container transition-colors"
              >
                {/* Image placeholder */}
                <Link
                  href={href}
                  className="size-20 shrink-0 bg-surface-container flex items-center justify-center"
                >
                  <span
                    className="text-[8px] uppercase text-muted-foreground/30"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    {product.category.toUpperCase()}
                  </span>
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span
                        className="text-[10px] font-medium uppercase text-muted-foreground/60"
                        style={{ letterSpacing: "0.1em" }}
                      >
                        {product.sku}
                      </span>
                      <Link href={href}>
                        <p
                          className="font-display text-xs font-semibold uppercase text-foreground hover:text-accent transition-colors line-clamp-2 mt-0.5"
                          style={{ letterSpacing: "0.04em" }}
                        >
                          {product.name}
                        </p>
                      </Link>
                    </div>
                    <button
                      onClick={() => remove(product.slug)}
                      aria-label={`Remove ${product.name} from favorites`}
                      className="shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive"
                    >
                      <Heart className="size-3.5 fill-primary text-primary" />
                    </button>
                  </div>

                  {/* Spec line */}
                  {product.category === "firearm" && (
                    <p
                      className="text-[10px] uppercase text-primary"
                      style={{ letterSpacing: "0.06em" }}
                    >
                      {product.caliber}
                    </p>
                  )}
                  {product.category === "part" && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {product.compatibility.slice(0, 2).join(" · ")}
                    </p>
                  )}
                  {product.category === "apparel" && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {product.colorSwatches[0]?.name} / {product.material}
                    </p>
                  )}

                  {/* Price + badge */}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                    <span className="font-display text-sm font-semibold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <AvailabilityBadge status={product.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
