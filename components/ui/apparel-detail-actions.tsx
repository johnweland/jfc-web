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

  const [selectedColor, setSelectedColor] = useState(
    item.colorSwatches[0]?.name ?? ""
  );
  const [selectedSize, setSelectedSize] = useState(
    item.sizes[0] === "One Size" ? "One Size" : ""
  );

  const isBackordered = item.status === "backordered";

  function handleAddToCart() {
    if (isBackordered) return;
    addItem({
      slug: item.slug,
      name: item.name,
      sku: item.sku,
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
                onClick={() => setSelectedColor(swatch.name)}
                className={`relative size-8 transition-transform hover:scale-110 ${
                  selectedColor === swatch.name ? "scale-110" : ""
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
                onClick={() => setSelectedSize(size)}
                className={`h-9 w-12 text-[10px] font-semibold uppercase transition-colors ${
                  selectedSize === size
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-container text-muted-foreground hover:bg-primary hover:text-primary-foreground"
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
        disabled={isBackordered || (item.sizes[0] !== "One Size" && !selectedSize)}
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
        }}
      />
    </>
  );
}
