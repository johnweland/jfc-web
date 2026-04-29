import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { orders } from "@/lib/data/orders";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrderHistoryPage() {
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
            DEPLOYMENT HISTORY
          </h2>
        </div>
        <span
          className="text-[10px] uppercase text-muted-foreground/50 shrink-0"
          style={{ letterSpacing: "0.1em" }}
        >
          {orders.length} ORDERS
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        {/* Table header */}
        <div
          className="grid gap-4 bg-surface-container-low px-5 py-3"
          style={{
            gridTemplateColumns: "minmax(0,1.2fr) 110px minmax(0,1.5fr) 110px 90px 60px",
          }}
        >
          {["ORDER ID", "DATE", "ITEMS", "STATUS", "TOTAL", ""].map((col) => (
            <span
              key={col}
              className="text-[10px] font-semibold uppercase text-muted-foreground/60"
              style={{ letterSpacing: "0.14em" }}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        {orders.map((order, i) => {
          const itemSummary =
            order.items.length === 1
              ? order.items[0].name
              : `${order.items[0].name} +${order.items.length - 1} more`;

          return (
            <div
              key={order.id}
              className={`grid gap-4 items-center px-5 py-4 transition-colors hover:bg-surface-container-high ${
                i % 2 === 0 ? "bg-surface-container" : "bg-surface-container-low"
              }`}
              style={{
                gridTemplateColumns:
                  "minmax(0,1.2fr) 110px minmax(0,1.5fr) 110px 90px 60px",
              }}
            >
              <span
                className="font-mono text-[11px] text-primary"
                style={{ letterSpacing: "0.06em" }}
              >
                {order.id}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatDate(order.placedAt)}
              </span>
              <span className="text-[11px] text-foreground truncate">
                {itemSummary}
              </span>
              <OrderStatusBadge status={order.status} />
              <span className="font-display text-sm font-semibold text-foreground">
                {formatPrice(order.total)}
              </span>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center gap-1 text-[10px] uppercase text-primary hover:text-accent transition-colors"
                style={{ letterSpacing: "0.08em" }}
              >
                VIEW
                <ArrowRight className="size-3" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block bg-surface-container-low p-4 hover:bg-surface-container transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span
                className="font-mono text-[11px] text-primary"
                style={{ letterSpacing: "0.06em" }}
              >
                #{order.id}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-foreground mb-1 line-clamp-1">
              {order.items.map((i) => i.name).join(", ")}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                {formatDate(order.placedAt)}
              </span>
              <span className="font-display text-sm font-semibold text-foreground">
                {formatPrice(order.total)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
