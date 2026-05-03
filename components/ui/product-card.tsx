"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { useCart } from "@/lib/cart/context";
import { useFavorites } from "@/lib/favorites/context";
import type { Product } from "@/lib/data/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function getCtaLabel(product: Product): string {
  if (product.category === "firearm") return "CONFIGURE";
  if (product.category === "apparel") return "SELECT OPTIONS";
  return "ADD TO CART";
}

function getProductHref(product: Product): string {
  if (product.category === "part") {
    return `/parts/${product.slug}`;
  }

  if (product.category === "apparel") {
    return `/apparel/${product.slug}`;
  }

  return `/firearms/${product.slug}`;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const href = getProductHref(product);
  const isOutOfStock = product.status === "backordered";
  const { addItem } = useCart();
  const { isFavorited, toggle: toggleFavorite } = useFavorites();
  const [primaryImage, setPrimaryImage] = useState(product.images[0] ?? "/placeholder.svg");
  const isPlaceholderImage = primaryImage === "/placeholder.svg";

  function handleCta(e: React.MouseEvent) {
    // Firearms and apparel require a detail-page step before carting.
    if (product.category === "firearm" || product.category === "apparel") return;
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      price: product.price,
      category: product.category,
      imageUrl: product.images[0],
      maxQuantity: product.availableQuantity,
      taxRate: product.taxRate,
      requiresFFL: product.requiresFFL,
    });
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-surface-container-low transition-colors hover:bg-surface-bright/20",
        className
      )}
    >
      {/* Image */}
      <Link href={href} className="relative block overflow-hidden aspect-[4/3] bg-surface-container">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className={
              isPlaceholderImage
                ? "absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                : "object-cover"
            }
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            onError={() => setPrimaryImage("/placeholder.svg")}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-xs uppercase text-muted-foreground/40 tracking-widest">
              {product.category.toUpperCase()}
            </span>
          </div>
        )}
        {/* Favorites button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite({
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              price: product.price,
              category: product.category,
              status: product.status,
              imageUrl: product.images[0],
            });
          }}
          aria-label={isFavorited(product.slug) ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorited(product.slug)}
          className={`absolute top-3 right-3 flex size-8 items-center justify-center bg-surface-container-high/80 transition-opacity group-hover:opacity-100 ${
            isFavorited(product.slug) ? "opacity-100" : "opacity-0"
          }`}
        >
          <Heart
            className={`size-3.5 transition-colors ${
              isFavorited(product.slug)
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* SKU + Badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-medium uppercase text-muted-foreground/60"
            style={{ letterSpacing: "0.1em" }}
          >
            {product.sku}
          </span>
          <AvailabilityBadge status={product.status} />
        </div>

        {/* Name */}
        <Link href={href}>
          <h3
            className="font-display text-sm font-semibold uppercase text-foreground transition-colors hover:text-accent line-clamp-2"
            style={{ letterSpacing: "0.04em" }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Specs line for firearms */}
        {product.category === "firearm" && (
          <p
            className="text-[11px] uppercase text-primary"
            style={{ letterSpacing: "0.06em" }}
          >
            {product.caliber}
          </p>
        )}

        {/* Parts compatibility */}
        {product.category === "part" && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {product.compatibility.slice(0, 3).join(" · ")}
          </p>
        )}

        {/* Apparel material + color */}
        {product.category === "apparel" && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {product.colorSwatches[0]?.name} / {product.material}
          </p>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <span className="font-display text-base font-semibold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="ml-2 text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <Button
            asChild
            size="sm"
            disabled={isOutOfStock}
            onClick={handleCta}
            className="gradient-primary text-primary-foreground text-[10px] font-bold uppercase shrink-0 rounded-none border-0 hover:opacity-90"
            style={{ letterSpacing: "0.08em" }}
          >
            <Link href={href}>{isOutOfStock ? "NOTIFY ME" : getCtaLabel(product)}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
