import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Download,
  MessageCircle,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { orders, getOrderById } from "@/lib/data/orders";

export function generateStaticParams() {
  return orders.map((o) => ({ id: o.id }));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) notFound();

  const canTrack = order.status === "shipped" || order.status === "delivered";
  const hasFfl = order.items.some((i) => i.requiresFFL);

  return (
    <>
      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <div className="bg-surface-container py-4 mb-0">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <Link
            href="/account/orders"
            className="flex items-center gap-2 text-xs uppercase text-muted-foreground hover:text-foreground transition-colors"
            style={{ letterSpacing: "0.1em" }}
          >
            <ArrowLeft className="size-3.5" />
            Order History
          </Link>
        </div>
      </div>

      {/* ── Order Header ─────────────────────────────────────── */}
      <section className="bg-surface py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="font-display text-[10px] font-semibold uppercase text-primary mb-1"
              style={{ letterSpacing: "0.18em" }}
            >
              ORDER AUTHENTICATION SUCCESSFUL
            </p>
            <h2
              className="font-display text-2xl font-bold uppercase text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              {order.id}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Placed {formatDate(order.placedAt)} &nbsp;·&nbsp;{" "}
              {order.paymentMethod.brand} ····{order.paymentMethod.last4}
            </p>
          </div>
          <OrderStatusBadge status={order.status} className="mt-1" />
        </div>
      </section>

      <div className="flex flex-col gap-8 pb-16">
        {/* ── Logistics Timeline ──────────────────────────────── */}
        <section className="bg-surface-container-low p-6">
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-6"
            style={{ letterSpacing: "0.18em" }}
          >
            LOGISTICS TIMELINE
          </p>

          <div className="flex flex-col">
            {order.logistics.map((event, idx) => {
              const isLast = idx === order.logistics.length - 1;
              return (
                <div key={event.label} className="flex gap-4">
                  {/* Indicator + connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`size-3 shrink-0 mt-0.5 ${
                        event.completed
                          ? "bg-primary"
                          : "bg-surface-container-highest"
                      }`}
                    />
                    {!isLast && (
                      <div
                        className={`flex-1 w-px my-1.5 ${
                          event.completed ? "bg-primary/60" : "bg-border/30"
                        }`}
                        style={{ minHeight: "2rem" }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-5 ${isLast ? "" : ""}`}>
                    <p
                      className={`font-display text-xs font-bold uppercase ${
                        event.completed
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                      }`}
                      style={{ letterSpacing: "0.08em" }}
                    >
                      {event.label}
                    </p>
                    {event.date && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(event.date)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Manifest Contents ───────────────────────────────── */}
        <section className="bg-surface-container-low p-6">
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-5"
            style={{ letterSpacing: "0.18em" }}
          >
            MANIFEST CONTENTS
          </p>

          <div className="flex flex-col gap-4">
            {order.items.map((item) => (
              <div key={item.slug} className="flex gap-4">
                {/* Image placeholder */}
                <div className="size-16 shrink-0 bg-surface-container-high flex items-center justify-center">
                  <span
                    className="text-[8px] uppercase text-muted-foreground/30"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    {item.category.toUpperCase()}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <div className="flex items-start justify-between gap-3">
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
                        className="font-display text-xs font-semibold uppercase text-foreground"
                        style={{ letterSpacing: "0.04em" }}
                      >
                        {item.quantity > 1 && `${item.quantity}× `}{item.name}
                      </p>
                      <p
                        className="text-[10px] uppercase text-muted-foreground/50 mt-0.5"
                        style={{ letterSpacing: "0.08em" }}
                      >
                        {item.sku}
                      </p>
                    </div>
                    <span className="font-display text-sm font-bold text-foreground shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>

                  {/* Firearm spec chips */}
                  {(item.caliber || item.barrelLength || item.weight) && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.caliber && (
                        <span
                          className="bg-surface-container-highest text-[10px] px-2 py-0.5 text-muted-foreground"
                          style={{ letterSpacing: "0.06em" }}
                        >
                          {item.caliber}
                        </span>
                      )}
                      {item.barrelLength && (
                        <span
                          className="bg-surface-container-highest text-[10px] px-2 py-0.5 text-muted-foreground"
                          style={{ letterSpacing: "0.06em" }}
                        >
                          BARREL: {item.barrelLength}
                        </span>
                      )}
                      {item.weight && (
                        <span
                          className="bg-surface-container-highest text-[10px] px-2 py-0.5 text-muted-foreground"
                          style={{ letterSpacing: "0.06em" }}
                        >
                          {item.weight}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Apparel variant */}
                  {(item.size || item.color) && (
                    <p className="text-[10px] text-muted-foreground/60">
                      {[
                        item.size && `SIZE: ${item.size}`,
                        item.color && `COLOR: ${item.color}`,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FFL Transfer Hub (conditional) ──────────────────── */}
        {hasFfl && order.fflDealer && (
          <section className="bg-surface-container p-6">
            <div className="flex items-center gap-2 mb-5">
              <ShieldCheck className="size-4 text-primary" />
              <p
                className="font-display text-[10px] font-semibold uppercase text-primary"
                style={{ letterSpacing: "0.18em" }}
              >
                FFL TRANSFER HUB
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p
                className="font-display text-base font-bold uppercase text-foreground"
                style={{ letterSpacing: "0.02em" }}
              >
                {order.fflDealer.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.fflDealer.address}
                <br />
                {order.fflDealer.city}, {order.fflDealer.state}{" "}
                {order.fflDealer.zip}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="font-mono text-[10px] bg-surface-container-highest text-primary px-2 py-0.5"
                  style={{ letterSpacing: "0.08em" }}
                >
                  FFL: {order.fflDealer.licenseNumber}
                </span>
                <span
                  className="text-[9px] uppercase bg-primary/10 text-accent px-2 py-0.5"
                  style={{ letterSpacing: "0.12em" }}
                >
                  VERIFIED
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── Financial Summary ────────────────────────────────── */}
        <section className="bg-surface-container-low p-6">
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary mb-5"
            style={{ letterSpacing: "0.18em" }}
          >
            FINANCIAL SUMMARY
          </p>

          <div className="flex flex-col gap-2 max-w-sm">
            {[
              { label: "Subtotal",          value: formatPrice(order.subtotal) },
              { label: "Insured Freight",   value: formatPrice(order.shippingCost) },
              { label: "Transfer Fees",     value: formatPrice(order.transferFees) },
              { label: "Tax",               value: formatPrice(order.taxAmount) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs text-muted-foreground">
                <span style={{ letterSpacing: "0.06em" }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}

            <Separator className="bg-border/30 my-2" />

            <div className="flex items-center justify-between">
              <span
                className="font-display text-xs font-bold uppercase text-foreground"
                style={{ letterSpacing: "0.1em" }}
              >
                TOTAL
              </span>
              <span className="font-display text-base font-bold text-primary">
                {formatPrice(order.total)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span style={{ letterSpacing: "0.06em" }}>Payment</span>
              <span>
                {order.paymentMethod.brand} ····{order.paymentMethod.last4}
              </span>
            </div>
          </div>
        </section>

        {/* ── Action Buttons ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="rounded-none uppercase font-bold border-border/30 text-foreground hover:bg-surface-container text-[10px] gap-2"
            style={{ letterSpacing: "0.1em" }}
          >
            <Download className="size-3.5" />
            DOWNLOAD INVOICE
          </Button>
          <Button
            variant="outline"
            className="rounded-none uppercase font-bold border-border/30 text-foreground hover:bg-surface-container text-[10px] gap-2"
            style={{ letterSpacing: "0.1em" }}
          >
            <MessageCircle className="size-3.5" />
            SUPPORT INQUIRY
          </Button>
          <Button
            disabled={!canTrack}
            className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-[10px] gap-2 disabled:opacity-40"
            style={{ letterSpacing: "0.1em" }}
          >
            <Navigation className="size-3.5" />
            TRACK SHIPMENT
          </Button>
        </div>
      </div>
    </>
  );
}
