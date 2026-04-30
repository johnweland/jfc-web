import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { ProductCard } from "@/components/ui/product-card";
import { ProductImageGallery } from "@/components/catalog/product-image-gallery";
import { AddToCartButton } from "@/components/ui/add-to-cart-button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { getLiveProductBySlug, getLiveProductsByCategory } from "@/lib/catalog/live";
import type { Firearm } from "@/lib/data/types";

export const dynamic = "force-dynamic";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

// Ordered spec rows — undefined values are omitted at render time
const specRows: { key: keyof Firearm; label: string }[] = [
  { key: "caliber",       label: "Caliber" },
  { key: "action",        label: "Action" },
  { key: "barrelLength",  label: "Barrel Length" },
  { key: "twistRate",     label: "Twist Rate" },
  { key: "gasSystem",     label: "Gas System" },
  { key: "triggerType",   label: "Trigger Type" },
  { key: "capacity",      label: "Capacity" },
  { key: "weight",        label: "Weight" },
  { key: "overallLength", label: "Overall Length" },
  { key: "finish",        label: "Finish" },
  { key: "manufacturer",  label: "Manufacturer" },
];

const fflSteps = [
  {
    step: "01",
    title: "SELECT YOUR FFL DEALER",
    body: "During checkout, provide the name and license number of your local FFL dealer. We'll contact them to confirm they'll accept the transfer before we ship.",
  },
  {
    step: "02",
    title: "WE COORDINATE SHIPPING",
    body: "Your firearm ships directly to your chosen FFL dealer via insured carrier, typically within 1–2 business days. You'll receive tracking updates by email.",
  },
  {
    step: "03",
    title: "PICK UP & COMPLETE TRANSFER",
    body: "Visit your FFL dealer with a valid government-issued ID. Complete ATF Form 4473 and pass a NICS background check. Upon approval, your firearm is yours.",
  },
];

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FirearmDetailPage({ params }: Props) {
  const { slug } = await params;
  const firearm = (await getLiveProductBySlug(slug, "firearm")) as Firearm | undefined;
  if (!firearm) notFound();

  const isBackordered = firearm.status === "backordered";

  const accessories = (await getLiveProductsByCategory("part"))
    .filter((p) => p.status !== "backordered")
    .slice(0, 4);

  const visibleSpecs = specRows.filter(({ key }) => firearm[key] !== undefined);

  return (
    <>
      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <div className="bg-surface-container">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12 py-4">
          <Link
            href="/firearms"
            className="inline-flex items-center gap-2 text-[10px] uppercase text-muted-foreground hover:text-foreground transition-colors"
            style={{ letterSpacing: "0.12em" }}
          >
            <ArrowLeft className="size-3" />
            Firearms
          </Link>
        </div>
      </div>

      {/* ── Product Hero ─────────────────────────────────────── */}
      <section className="bg-surface py-14">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">

            {/* Left — image */}
            <ProductImageGallery
              images={firearm.images}
              productName={firearm.name}
              emptyLabel="PRODUCT IMAGE"
            />

            {/* Right — identity, price, description, CTAs */}
            <div className="flex flex-col gap-6">
              {/* Serial tag + series */}
              <div className="flex flex-wrap items-center gap-3">
                {firearm.serialTag && (
                  <span
                    className="font-display text-[10px] font-semibold uppercase bg-surface-container-highest text-primary px-2 py-1"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {firearm.serialTag}
                  </span>
                )}
                {firearm.series && (
                  <span
                    className="text-[10px] uppercase text-muted-foreground/60"
                    style={{ letterSpacing: "0.12em" }}
                  >
                    {firearm.series}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1
                className="font-display font-bold uppercase text-foreground leading-none"
                style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  letterSpacing: "-0.025em",
                }}
              >
                {firearm.name}
              </h1>

              {/* Price + status */}
              <div className="flex items-center gap-4">
                <span
                  className="font-display text-2xl font-bold text-foreground"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {formatPrice(firearm.price)}
                </span>
                {firearm.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(firearm.originalPrice)}
                  </span>
                )}
                <AvailabilityBadge status={firearm.status} />
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {firearm.description}
              </p>

              <Separator className="bg-border/20" />

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <AddToCartButton
                  product={{
                    slug: firearm.slug,
                    name: firearm.name,
                    sku: firearm.sku,
                    price: firearm.price,
                    category: "firearm",
                    requiresFFL: firearm.requiresFFL,
                  }}
                  backordered={isBackordered}
                />

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-none uppercase font-bold border-border/30 text-foreground hover:bg-surface-container w-full justify-center gap-3 text-xs"
                  style={{ letterSpacing: "0.12em" }}
                >
                  <Link href="/parts">
                    <ShoppingBag className="size-4 shrink-0" />
                    BUY ACCESSORIES ONLY
                  </Link>
                </Button>

                <FavoriteButton
                  product={{
                    slug: firearm.slug,
                    name: firearm.name,
                    sku: firearm.sku,
                    price: firearm.price,
                    category: "firearm",
                    status: firearm.status,
                    imageUrl: firearm.images[0],
                  }}
                />
              </div>

              {/* FFL disclaimer */}
              <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                All regulated firearm sales require shipment to a valid Federal
                Firearms Licensee. Age and residency restrictions apply.{" "}
                <Link
                  href="/ffl-info"
                  className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Technical Specifications ─────────────────────────── */}
      <section className="bg-surface-container-lowest py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p
                className="font-display text-xs font-semibold uppercase text-primary mb-2"
                style={{ letterSpacing: "0.18em" }}
              >
                {firearm.serialTag ?? firearm.sku}
              </p>
              <h2
                className="font-display text-2xl font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.02em" }}
              >
                TECHNICAL SPECIFICATIONS
              </h2>
            </div>
            <p
              className="text-[10px] uppercase text-muted-foreground/50"
              style={{ letterSpacing: "0.12em" }}
            >
              {firearm.series}
            </p>
          </div>

          {/* Spec tiles grid */}
          <div className="grid grid-cols-2 gap-px lg:grid-cols-3 xl:grid-cols-4 bg-border/10">
            {visibleSpecs.map(({ key, label }) => (
              <div
                key={key}
                className="relative flex flex-col gap-2 bg-surface-container-low px-5 py-6"
              >
                {/* Gold left-border accent */}
                <span className="absolute left-0 top-4 bottom-4 w-[2px] bg-primary/60" />

                <dt
                  className="text-[10px] uppercase text-muted-foreground/60"
                  style={{ letterSpacing: "0.14em" }}
                >
                  {label}
                </dt>
                <dd
                  className="font-display text-sm font-semibold text-primary leading-tight"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {String(firearm[key])}
                </dd>
              </div>
            ))}
          </div>

          {/* Compliance note */}
          <p
            className="mt-8 text-[10px] uppercase text-muted-foreground/40"
            style={{ letterSpacing: "0.1em" }}
          >
            Specifications subject to change without notice. All measurements
            nominal. Verify with dealer prior to purchase.
          </p>
        </div>
      </section>

      {/* ── FFL Transfer Process ─────────────────────────────── */}
      <section className="bg-surface-container py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">

          {/* Section header */}
          <p
            className="font-display text-xs font-semibold uppercase text-primary mb-3"
            style={{ letterSpacing: "0.18em" }}
          >
            How It Works
          </p>
          <h2
            className="font-display text-2xl font-bold uppercase text-foreground mb-14"
            style={{ letterSpacing: "-0.02em" }}
          >
            THE FFL TRANSFER PROCESS
          </h2>

          {/* 5-col grid: steps (3) + image (2) */}
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">

            {/* Steps — left 3 cols */}
            <div className="lg:col-span-3 flex flex-col">
              {fflSteps.map((s, i) => (
                <div key={s.step} className="flex gap-6 relative">
                  {/* Step number + connector line */}
                  <div className="flex flex-col items-center shrink-0 w-16">
                    <span
                      className="font-display text-3xl font-bold text-primary/25 leading-none pt-1"
                      style={{ letterSpacing: "-0.04em" }}
                    >
                      {s.step}
                    </span>
                    {/* Connector line — hidden on last step */}
                    {i < fflSteps.length - 1 && (
                      <span className="flex-1 w-px bg-border/30 my-3" />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex flex-col gap-3 pb-10 ${
                      i === fflSteps.length - 1 ? "pb-0" : ""
                    }`}
                  >
                    <ShieldCheck className="size-4 text-primary mt-1" />
                    <h3
                      className="font-display text-xs font-bold uppercase text-foreground"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mt-6 pl-22">
                <Link
                  href="/ffl-info"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-primary hover:text-accent transition-colors"
                  style={{ letterSpacing: "0.12em" }}
                >
                  FULL FFL FAQ
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Image panel — right 2 cols, desktop only */}
            <div className="topo-bg hidden lg:flex lg:col-span-2 flex-col items-center justify-center gap-6 bg-surface-container-high min-h-full ml-14 p-12">
              {/* Shield emblem */}
              <div className="relative flex items-center justify-center">
                <div className="size-28 bg-surface-container-highest/60 flex items-center justify-center">
                  <ShieldCheck
                    className="size-14 text-primary"
                    strokeWidth={1}
                  />
                </div>
                {/* Corner accents */}
                <span className="absolute -top-1.5 -left-1.5 size-4 border-t-2 border-l-2 border-primary/60" />
                <span className="absolute -top-1.5 -right-1.5 size-4 border-t-2 border-r-2 border-primary/60" />
                <span className="absolute -bottom-1.5 -left-1.5 size-4 border-b-2 border-l-2 border-primary/60" />
                <span className="absolute -bottom-1.5 -right-1.5 size-4 border-b-2 border-r-2 border-primary/60" />
              </div>

              <div className="text-center">
                <p
                  className="font-display text-xs font-bold uppercase text-primary mb-1"
                  style={{ letterSpacing: "0.2em" }}
                >
                  VERIFIED TRANSFER
                </p>
                <p
                  className="text-[10px] uppercase text-muted-foreground/60"
                  style={{ letterSpacing: "0.14em" }}
                >
                  Federal Firearms Licensee
                </p>
              </div>

              <Separator className="w-16 bg-primary/20" />

              <p
                className="text-[10px] text-center text-muted-foreground/50 max-w-[180px] leading-relaxed uppercase"
                style={{ letterSpacing: "0.08em" }}
              >
                All transfers comply with ATF regulations and applicable state
                law
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Accessories ──────────────────────────────────────── */}
      {accessories.length > 0 && (
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p
                  className="font-display text-xs font-semibold uppercase text-primary mb-2"
                  style={{ letterSpacing: "0.18em" }}
                >
                  Pair With
                </p>
                <h2
                  className="font-display text-2xl font-bold uppercase text-foreground"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  RECOMMENDED ACCESSORIES
                </h2>
              </div>
              <Link
                href="/parts"
                className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground hover:text-accent transition-colors"
                style={{ letterSpacing: "0.12em" }}
              >
                VIEW ALL
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {accessories.map((part) => (
                <ProductCard key={part.slug} product={part} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
