import Link from "next/link";
import { ArrowRight, Shield, Zap, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { getFeaturedProducts } from "@/lib/data";

const categories = [
  {
    label: "FIREARMS",
    tagline: "Complete platforms. FFL transfer ready.",
    href: "/firearms",
    accent: "Rifles · Handguns · Shotguns",
    colSpan: "lg:col-span-2",
    rowHeight: "h-80 lg:h-96",
  },
  {
    label: "PARTS",
    tagline: "Mil-spec components. Build or upgrade.",
    href: "/parts",
    accent: "BCGs · Triggers · Optics · More",
    colSpan: "lg:col-span-1",
    rowHeight: "h-80 lg:h-96",
  },
  {
    label: "APPAREL",
    tagline: "Range ready. Street approved.",
    href: "/apparel",
    accent: "Tees · Hats · Hoodies · Gear",
    colSpan: "lg:col-span-1",
    rowHeight: "h-80",
  },
];

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="topo-bg relative min-h-[80vh] flex items-center bg-surface">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12 py-24 w-full">
          <div className="max-w-3xl">
            <p
              className="font-display text-xs font-semibold uppercase text-primary mb-6"
              style={{ letterSpacing: "0.18em" }}
            >
              Federal Firearms Licensee · Est. 2025
            </p>
            <h1
              className="font-display font-bold text-foreground leading-none mb-8"
              style={{
                fontSize: "clamp(2.75rem, 6vw, 5rem)",
                letterSpacing: "-0.03em",
              }}
            >
              EQUIPPING
              <br />
              <span className="text-primary">THE MODERN</span>
              <br />
              OPERATOR
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mb-12 leading-relaxed">
              Premium firearms, mil-spec components, and tactical apparel.
              Serving the serious shooter with the precision they demand.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 px-8"
                style={{ letterSpacing: "0.1em" }}
              >
                <Link href="/firearms">
                  SHOP FIREARMS
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-none uppercase font-bold border-border/30 text-foreground hover:bg-surface-container"
                style={{ letterSpacing: "0.1em" }}
              >
                <Link href="/ffl-info">FFL INFO</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 flex flex-col items-center gap-2 opacity-40">
          <span
            className="text-[10px] uppercase text-foreground"
            style={{ letterSpacing: "0.2em" }}
          >
            Scroll
          </span>
          <div className="h-8 w-px bg-foreground/40" />
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="bg-surface-container py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="mb-12">
            <p
              className="font-display text-xs font-semibold uppercase text-primary mb-2"
              style={{ letterSpacing: "0.18em" }}
            >
              Browse by Category
            </p>
            <h2
              className="font-display text-3xl font-bold uppercase text-foreground"
              style={{ letterSpacing: "-0.02em" }}
            >
              WHAT ARE YOU LOOKING FOR?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`group relative flex flex-col justify-end bg-surface-container-high overflow-hidden ${cat.colSpan} ${cat.rowHeight} p-8 transition-colors hover:bg-surface-bright`}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent" />

                <div className="relative z-10">
                  <p
                    className="font-display text-[10px] font-medium uppercase text-primary mb-2"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {cat.accent}
                  </p>
                  <h3
                    className="font-display text-2xl font-bold uppercase text-foreground mb-1 transition-colors group-hover:text-primary"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {cat.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">{cat.tagline}</p>
                  <ArrowRight className="mt-4 size-5 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FFL Priority Processing ──────────────────────────── */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="flex flex-col gap-4">
              <Shield className="size-8 text-primary" />
              <h3
                className="font-display text-lg font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.01em" }}
              >
                FFL TRANSFER
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Purchase online and transfer to any licensed FFL dealer near
                you. Our streamlined process makes interstate transfers simple.
              </p>
              <Link
                href="/ffl-info"
                className="mt-auto text-xs font-semibold uppercase text-primary hover:text-accent transition-colors"
                style={{ letterSpacing: "0.1em" }}
              >
                LEARN MORE →
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              <Zap className="size-8 text-primary" />
              <h3
                className="font-display text-lg font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.01em" }}
              >
                FAST PROCESSING
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Most orders ship within 1–2 business days. Priority processing
                available. Real-time inventory — what you see is what we have.
              </p>
              <Link
                href="/firearms"
                className="mt-auto text-xs font-semibold uppercase text-primary hover:text-accent transition-colors"
                style={{ letterSpacing: "0.1em" }}
              >
                SHOP NOW →
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              <Package className="size-8 text-primary" />
              <h3
                className="font-display text-lg font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.01em" }}
              >
                SECURE SHIPPING
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All firearms shipped to FFL holders only. Parts and accessories
                ship direct to your door via insured, discreet packaging.
              </p>
              <Link
                href="/parts"
                className="mt-auto text-xs font-semibold uppercase text-primary hover:text-accent transition-colors"
                style={{ letterSpacing: "0.1em" }}
              >
                SHOP PARTS →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Inventory ───────────────────────────────── */}
      <section className="bg-surface-container-low py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p
                className="font-display text-xs font-semibold uppercase text-primary mb-2"
                style={{ letterSpacing: "0.18em" }}
              >
                Featured Inventory
              </p>
              <h2
                className="font-display text-3xl font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.02em" }}
              >
                SELECTED PIECES
              </h2>
            </div>
            <Button
              asChild
              variant="ghost"
              className="hidden md:flex uppercase font-bold text-xs text-muted-foreground hover:text-accent rounded-none"
              style={{ letterSpacing: "0.1em" }}
            >
              <Link href="/firearms">
                VIEW ALL <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
