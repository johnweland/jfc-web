import Link from "next/link";
import {
  ArrowRight,
  Settings2,
  Truck,
  FileText,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    month: "long",
    year: "numeric",
  });
}

const recentOrder = orders[0];

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* ── Operator Profile ──────────────────────────────────── */}
      <section className="bg-surface-container-low p-6 flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="size-20 shrink-0 bg-surface-container-highest flex items-center justify-center">
          <span className="font-display text-lg font-bold text-primary">
            GRJ
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                className="font-display text-xl font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.02em" }}
              >
                Garrett R. Jackson
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                g.jackson@jacksonfirearmco.com
              </p>
              <p
                className="text-[10px] uppercase text-muted-foreground/50 mt-1"
                style={{ letterSpacing: "0.1em" }}
              >
                MEMBER SINCE {formatDate("2025-03-01")}
              </p>
            </div>
            <span
              className="inline-flex items-center bg-surface-container-highest px-2 py-0.5 text-[10px] font-semibold uppercase text-accent"
              style={{ letterSpacing: "0.12em" }}
            >
              PRECISION ELITE
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-none uppercase font-bold border-border/30 text-foreground hover:bg-surface-container w-fit text-[10px]"
            style={{ letterSpacing: "0.1em" }}
          >
            EDIT PROFILE
          </Button>
        </div>
      </section>

      {/* ── Stat Tiles ───────────────────────────────────────── */}
      <section>
        <p
          className="font-display text-[10px] font-semibold uppercase text-primary mb-4"
          style={{ letterSpacing: "0.18em" }}
        >
          DASHBOARD
        </p>
        <div className="grid grid-cols-3 gap-px bg-border/10">
          {[
            { icon: Settings2, count: 3,  label: "Saved Configurations" },
            { icon: Truck,     count: 1,  label: "Active Shipments" },
            { icon: FileText,  count: 2,  label: "FFL Documents" },
          ].map(({ icon: Icon, count, label }) => (
            <div key={label} className="bg-surface-container px-5 py-8 flex flex-col gap-3">
              <Icon className="size-5 text-muted-foreground/50" />
              <span className="font-display text-3xl font-bold text-primary">
                {count}
              </span>
              <span
                className="text-[10px] uppercase text-muted-foreground/60"
                style={{ letterSpacing: "0.1em" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent Deployment ────────────────────────────────── */}
      <section className="bg-surface-container-low p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <p
            className="font-display text-[10px] font-semibold uppercase text-primary"
            style={{ letterSpacing: "0.18em" }}
          >
            RECENT DEPLOYMENT
          </p>
          <Link
            href="/account/orders"
            className="flex items-center gap-1 text-[10px] uppercase text-primary hover:text-accent transition-colors"
            style={{ letterSpacing: "0.1em" }}
          >
            VIEW ALL
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p
              className="font-mono text-[11px] text-primary"
              style={{ letterSpacing: "0.08em" }}
            >
              #{recentOrder.id}
            </p>
            <p
              className="font-display text-sm font-semibold uppercase text-foreground"
              style={{ letterSpacing: "0.02em" }}
            >
              {recentOrder.items.map((i) => i.name).join(" + ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(recentOrder.placedAt)} &nbsp;·&nbsp;{" "}
              {formatPrice(recentOrder.total)}
            </p>
          </div>
          <OrderStatusBadge status={recentOrder.status} className="shrink-0" />
        </div>

        <Link
          href={`/account/orders/${recentOrder.id}`}
          className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground hover:text-foreground transition-colors w-fit"
          style={{ letterSpacing: "0.1em" }}
        >
          VIEW ORDER DETAILS
          <ArrowRight className="size-3" />
        </Link>
      </section>

      {/* ── Account Integrity ────────────────────────────────── */}
      <section className="bg-surface-container p-6 flex flex-col gap-4">
        <p
          className="font-display text-[10px] font-semibold uppercase text-primary"
          style={{ letterSpacing: "0.18em" }}
        >
          ACCOUNT INTEGRITY
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-4 text-destructive shrink-0" />
            <div>
              <p
                className="text-[11px] font-semibold uppercase text-foreground"
                style={{ letterSpacing: "0.08em" }}
              >
                2FA STATUS: INACTIVE
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                Two-factor authentication is not enabled on this account.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4 text-accent shrink-0" />
            <div>
              <p
                className="text-[11px] font-semibold uppercase text-foreground"
                style={{ letterSpacing: "0.08em" }}
              >
                AES-256 DATA ENCRYPTION: ACTIVE
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                All account data is encrypted at rest and in transit.
              </p>
            </div>
          </div>
        </div>

        <Button
          className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 w-fit text-[10px]"
          style={{ letterSpacing: "0.12em" }}
        >
          HARDEN ACCOUNT
          <ShieldCheck className="ml-2 size-3.5" />
        </Button>
      </section>
    </div>
  );
}
