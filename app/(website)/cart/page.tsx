"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
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

const steps = [
  { num: "01", label: "CART",          active: true },
  { num: "02", label: "FFL SELECTION", active: false },
  { num: "03", label: "PAYMENT",       active: false },
];

export default function CartPage() {
  const { items, subtotal, estimatedTax, total, removeItem, setQuantity } = useCart();
  const hasFfl = items.some((i) => i.requiresFFL);

  return (
    <div className="bg-surface min-h-screen">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-12 py-10">
        {/* ── Page heading ──────────────────────────────────────── */}
        <div className="mb-8">
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-1"
            style={{ letterSpacing: "0.2em" }}
          >
            JACKSON FIREARM CO.
          </p>
          <h1
            className="font-display text-3xl font-bold uppercase text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            YOUR ARMORY
          </h1>
        </div>

        {/* ── Checkout progress stepper ────────────────────────── */}
        <div className="flex items-center mb-10">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase ${
                  step.active
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-container text-muted-foreground/40"
                }`}
                style={{ letterSpacing: "0.1em" }}
              >
                <span>{step.num}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-px ${
                    step.active ? "bg-primary/40" : "bg-border/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Empty state ──────────────────────────────────────── */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-32 text-center">
            <ShoppingCart className="size-12 text-muted-foreground/20" />
            <div>
              <h2
                className="font-display text-xl font-bold uppercase text-foreground mb-2"
                style={{ letterSpacing: "-0.01em" }}
              >
                YOUR ARMORY IS EMPTY
              </h2>
              <p className="text-sm text-muted-foreground">
                Add firearms, parts, or apparel to get started.
              </p>
            </div>
            <Button
              asChild
              className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-xs gap-2"
              style={{ letterSpacing: "0.12em" }}
            >
              <Link href="/firearms">
                BROWSE FIREARMS
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          /* ── Two-column layout ──────────────────────────────── */
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
            {/* ── Left: Items ─────────────────────────────────── */}
            <div className="flex flex-col">
              <div className="bg-surface-container-low divide-y divide-surface-container-high">
                {items.map((item) => (
                  <div key={item.slug} className="flex gap-4 p-5">
                    {(() => {
                      const atLimit =
                        item.maxQuantity != null && item.quantity >= item.maxQuantity;

                      return (
                        <>
                    <div className="relative size-20 shrink-0 overflow-hidden bg-surface-container flex items-center justify-center">
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

                    {/* Details */}
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
                                FFL TRANSFER REQUIRED
                              </span>
                            </div>
                          )}
                          <p
                            className="font-display text-xs font-semibold uppercase text-foreground leading-tight"
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
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* Price + qty */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="font-display text-sm font-bold text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </span>

                        <div className="flex items-center bg-surface-container">
                          <button
                            onClick={() =>
                              setQuantity(item.slug, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-container-high"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span
                            className="w-9 text-center text-xs font-semibold text-foreground"
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
                            className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-container-high disabled:cursor-not-allowed disabled:text-muted-foreground/30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/30"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {/* Continue shopping */}
              <div className="mt-4">
                <Link
                  href="/firearms"
                  className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground hover:text-foreground transition-colors w-fit"
                  style={{ letterSpacing: "0.1em" }}
                >
                  <ArrowRight className="size-3 rotate-180" />
                  CONTINUE SHOPPING
                </Link>
              </div>
            </div>

            {/* ── Right: Order Summary ─────────────────────────── */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-surface-container-high shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 flex flex-col gap-4">
                <p
                  className="font-display text-[10px] font-semibold uppercase text-primary"
                  style={{ letterSpacing: "0.18em" }}
                >
                  ORDER SUMMARY
                </p>

                {/* Totals */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span style={{ letterSpacing: "0.08em" }}>SUBTOTAL</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span style={{ letterSpacing: "0.08em" }}>SHIPPING</span>
                    <span style={{ letterSpacing: "0.04em" }}>
                      Calculated at checkout
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span style={{ letterSpacing: "0.08em" }}>
                      ESTIMATED TAX
                    </span>
                    <span>{formatPrice(estimatedTax)}</span>
                  </div>

                  <Separator className="bg-border/20 my-1" />

                  <div className="flex items-center justify-between">
                    <span
                      className="font-display text-xs font-bold uppercase text-foreground"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      GRAND TOTAL
                    </span>
                    <span className="font-display text-lg font-bold text-primary">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* FFL notice */}
                {hasFfl && (
                  <div className="flex items-start gap-2 bg-surface-container p-3">
                    <ShieldCheck className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      One or more items require an FFL transfer. Dealer
                      selection at next step.
                    </p>
                  </div>
                )}

                {/* CTA */}
                <Button
                  asChild
                  className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 w-full justify-center gap-2 text-xs"
                  style={{ letterSpacing: "0.12em" }}
                >
                  <Link href="/checkout">
                    PROCEED TO CHECKOUT
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>

                {/* Security note */}
                <div className="flex items-center justify-center gap-1.5">
                  <Lock className="size-3 text-muted-foreground/40" />
                  <p
                    className="text-[10px] text-muted-foreground/40 uppercase"
                    style={{ letterSpacing: "0.06em" }}
                  >
                    256-bit encrypted checkout
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
