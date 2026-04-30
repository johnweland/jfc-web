"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart/context";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { Apparel } from "@/lib/data/types";

interface ApparelDetailActionsProps {
  item: Apparel;
}

export function ApparelDetailActions({ item }: ApparelDetailActionsProps) {
  const { addItem } = useCart();

  const variants = item.variants ?? [];
  const hasVariantInventory = variants.length > 0;
  const availableVariants = variants.filter((variant) => variant.quantity > 0);

  const defaultVariant = availableVariants[0] ?? variants[0];
  const [selectedColor, setSelectedColor] = useState(
    () => defaultVariant?.color ?? item.colorSwatches[0]?.name ?? "",
  );
  const [selectedSize, setSelectedSize] = useState(
    () => defaultVariant?.size ?? (item.sizes[0] === "One Size" ? "One Size" : ""),
  );

  const isBackordered = item.status === "backordered";
  const selectedVariant = availableVariants.find(
    (variant) => variant.color === selectedColor && variant.size === selectedSize,
  );
  const effectiveSku = selectedVariant?.sku ?? item.sku;

  function isAvailableCombination(color: string, size: string) {
    if (!hasVariantInventory) {
      return true;
    }

    return availableVariants.some(
      (variant) => variant.color === color && variant.size === size,
    );
  }

  function isColorAvailable(color: string) {
    if (!hasVariantInventory) {
      return true;
    }

    return availableVariants.some(
      (variant) =>
        variant.color === color &&
        (!selectedSize || variant.size === selectedSize),
    );
  }

  function isSizeAvailable(size: string) {
    if (!hasVariantInventory) {
      return true;
    }

    return availableVariants.some(
      (variant) =>
        variant.size === size &&
        (!selectedColor || variant.color === selectedColor),
    );
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color);

    if (!hasVariantInventory || isAvailableCombination(color, selectedSize)) {
      return;
    }

    const nextVariant =
      availableVariants.find((variant) => variant.color === color) ?? defaultVariant;

    if (nextVariant) {
      setSelectedSize(nextVariant.size);
    }
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size);

    if (!hasVariantInventory || isAvailableCombination(selectedColor, size)) {
      return;
    }

    const nextVariant =
      availableVariants.find((variant) => variant.size === size) ?? defaultVariant;

    if (nextVariant) {
      setSelectedColor(nextVariant.color);
    }
  }

  function handleAddToCart() {
    if (isBackordered) return;
    addItem({
      slug: item.slug,
      name: item.name,
      sku: effectiveSku,
      price: item.price,
      category: "apparel",
      requiresFFL: false,
      size: selectedSize !== "One Size" ? selectedSize : undefined,
      color: selectedColor || undefined,
    });
  }

  return (
    <>
      <Separator className="bg-border/30" />

      {/* Colors */}
      {item.colorSwatches.length > 0 && (
        <div>
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-3"
            style={{ letterSpacing: "0.15em" }}
          >
            Finish / Color
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {item.colorSwatches.map((swatch) => (
              <button
                key={swatch.name}
                title={swatch.name}
                aria-label={swatch.name}
                aria-pressed={selectedColor === swatch.name}
                onClick={() => handleColorSelect(swatch.name)}
                className={`relative size-8 border transition-transform ${
                  selectedColor === swatch.name ? "scale-110" : ""
                } ${
                  isColorAvailable(swatch.name)
                    ? "border-transparent hover:scale-110"
                    : "border-dashed border-muted-foreground/40 opacity-45"
                }`}
                style={{ backgroundColor: swatch.hex }}
              >
                {selectedColor === swatch.name && (
                  <span className="absolute -inset-0.5 outline outline-1 outline-primary pointer-events-none" />
                )}
              </button>
            ))}
          </div>
          <p
            className="mt-2 text-[11px] text-muted-foreground"
            style={{ letterSpacing: "0.06em" }}
          >
            {selectedColor} / {item.material}
          </p>
        </div>
      )}

      {/* Sizes */}
      {item.sizes[0] !== "One Size" && (
        <div>
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-3"
            style={{ letterSpacing: "0.15em" }}
          >
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {item.sizes.map((size) => (
              <button
                key={size}
                aria-pressed={selectedSize === size}
                onClick={() => handleSizeSelect(size)}
                className={`h-9 w-12 border text-[10px] font-semibold uppercase transition-colors ${
                  selectedSize === size
                    ? "bg-primary text-primary-foreground"
                    : isSizeAvailable(size)
                      ? "bg-surface-container text-muted-foreground hover:bg-primary hover:text-primary-foreground border-transparent"
                      : "bg-surface-container text-muted-foreground/45 border-dashed border-muted-foreground/40"
                }`}
                style={{ letterSpacing: "0.06em" }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-border/30" />

      {/* CTAs */}
      <Button
        size="lg"
        disabled={
          isBackordered ||
          (item.sizes[0] !== "One Size" && !selectedSize) ||
          (hasVariantInventory && !selectedVariant)
        }
        onClick={handleAddToCart}
        className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 w-full"
        style={{ letterSpacing: "0.1em" }}
      >
        {isBackordered ? "NOTIFY ME WHEN AVAILABLE" : "ADD TO CART"}
        <ArrowRight className="ml-2 size-4" />
      </Button>
      <FavoriteButton
        product={{
          slug: item.slug,
          name: item.name,
          sku: item.sku,
          price: item.price,
          category: "apparel",
          status: item.status,
          imageUrl: item.images[0],
        }}
      />
    </>
  );
}
