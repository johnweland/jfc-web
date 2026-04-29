"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart/context";

interface AddToCartButtonProps {
  product: Omit<CartItem, "quantity">;
  label?: string;
  backordered?: boolean;
}

export function AddToCartButton({
  product,
  label,
  backordered = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  const defaultLabel = product.category === "firearm"
    ? "INITIATE FFL TRANSFER"
    : "ADD TO CART";

  const buttonLabel = backordered ? "NOTIFY ME WHEN AVAILABLE" : (label ?? defaultLabel);
  const Icon = product.category === "firearm" ? ShieldCheck : ArrowRight;

  return (
    <Button
      size="lg"
      disabled={backordered}
      onClick={() => !backordered && addItem(product)}
      className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 w-full justify-center gap-3 text-xs"
      style={{ letterSpacing: "0.12em" }}
    >
      <Icon className="size-4 shrink-0" />
      {buttonLabel}
    </Button>
  );
}
