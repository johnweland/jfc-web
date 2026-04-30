"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShieldCheck,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart/context";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function CartDrawer() {
  const { items, isOpen, subtotal, estimatedTax, total, removeItem, setQuantity, closeCart } =
    useCart();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCart]);

  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-surface/80 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ── Drawer panel ───────────────────────────────────────── */}
      <aside
        aria-label="Shopping cart"
        aria-modal="true"
        role="dialog"
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface-container-high shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out md:w-[480px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Topo texture overlay */}
        <div
          className="topo-bg pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
        />

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-between gap-4 border-b border-border/15 px-6 py-5">
          <div>
            <p
              className="font-display text-[10px] font-semibold uppercase text-primary"
              style={{ letterSpacing: "0.2em" }}
            >
              JACKSON FIREARM CO.
            </p>
            <h2
              className="font-display text-lg font-bold uppercase text-foreground"
              style={{ letterSpacing: "-0.01em" }}
            >
              YOUR ARMORY
            </h2>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="flex size-9 items-center justify-center bg-surface-container-highest text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Items ──────────────────────────────────────────────── */}
        <div className="relative flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center px-6">
              <p
                className="font-display text-sm font-bold uppercase text-muted-foreground"
                style={{ letterSpacing: "0.08em" }}
              >
                YOUR ARMORY IS EMPTY
              </p>
              <p className="text-xs text-muted-foreground/60">
                Add firearms, parts, or apparel to get started.
              </p>
              <Button
                asChild
                size="sm"
                className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 mt-2 text-xs"
                style={{ letterSpacing: "0.1em" }}
                onClick={closeCart}
              >
                <Link href="/firearms">BROWSE FIREARMS</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/10">
              {items.map((item) => (
                <li key={item.slug} className="flex gap-4 px-6 py-5">
                  {(() => {
                    const atLimit =
                      item.maxQuantity != null && item.quantity >= item.maxQuantity;

                    return (
                      <>
                  <div className="relative size-20 shrink-0 overflow-hidden bg-surface-container-low flex items-center justify-center">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <span
                        className="text-[8px] uppercase text-muted-foreground/30"
                        style={{ letterSpacing: "0.1em" }}
                      >
                        {item.category.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Item details */}
                  <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {item.requiresFFL && (
                          <div className="flex items-center gap-1 mb-1">
                            <ShieldCheck className="size-2.5 text-primary" />
                            <span
                              className="text-[9px] uppercase text-primary font-semibold"
                              style={{ letterSpacing: "0.12em" }}
                            >
                              FFL REQUIRED
                            </span>
                          </div>
                        )}
                        <p
                          className="font-display text-xs font-semibold uppercase text-foreground leading-tight line-clamp-2"
                          style={{ letterSpacing: "0.04em" }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="mt-0.5 text-[10px] uppercase text-muted-foreground/50"
                          style={{ letterSpacing: "0.08em" }}
                        >
                          {item.sku}
                        </p>
                        {(item.size || item.color) && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                            {[
                              item.size && `SIZE: ${item.size}`,
                              item.color && `COLOR: ${item.color}`,
                            ]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.slug)}
                        aria-label={`Remove ${item.name}`}
                        className="shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Price + qty */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </span>

                      {/* Qty controls */}
                      <div className="flex items-center bg-surface-container">
                        <button
                          onClick={() =>
                            setQuantity(item.slug, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-container-high"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span
                          className="w-8 text-center text-xs font-semibold text-foreground"
                          style={{ letterSpacing: "0.04em" }}
                        >
                        {item.quantity}
                        </span>
                        <button
                          disabled={atLimit}
                          onClick={() =>
                            setQuantity(item.slug, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-container-high disabled:cursor-not-allowed disabled:text-muted-foreground/30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/30"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                      </>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer / Summary ───────────────────────────────────── */}
        {items.length > 0 && (
          <div className="relative border-t border-border/15 bg-surface-container-highest px-6 py-6 flex flex-col gap-4">
            {/* Totals */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span style={{ letterSpacing: "0.08em" }}>SUBTOTAL</span>
                <span className="font-semibold text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span style={{ letterSpacing: "0.08em" }}>ESTIMATED TAX</span>
                <span className="font-semibold text-foreground">{formatPrice(estimatedTax)}</span>
              </div>
              <Separator className="bg-border/20 my-1" />
              <div className="flex items-center justify-between">
                <span
                  className="font-display text-xs font-bold uppercase text-foreground"
                  style={{ letterSpacing: "0.1em" }}
                >
                  TOTAL ORDER
                </span>
                <span className="font-display text-base font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <Button
                asChild
                className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 w-full justify-center gap-2 text-xs"
                style={{ letterSpacing: "0.12em" }}
                onClick={closeCart}
              >
                <Link href="/checkout">PROCEED TO CHECKOUT
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-none uppercase font-bold border-border/30 text-foreground hover:bg-surface-container w-full justify-center text-xs"
                style={{ letterSpacing: "0.1em" }}
                onClick={closeCart}
              >
                <Link href="/cart">VIEW FULL CART</Link>
              </Button>
            </div>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5">
              <Lock className="size-3 text-muted-foreground/40" />
              <p
                className="text-[10px] text-muted-foreground/40 uppercase"
                style={{ letterSpacing: "0.06em" }}
              >
                Secure checkout encrypted with 256-bit protocol
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
