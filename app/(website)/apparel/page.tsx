"use client";

import { useState } from "react";
import { Mail, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apparel } from "@/lib/data/apparel";

// ─── Filter data ────────────────────────────────────────────────────────────

const categoryOptions = [
  { label: "ALL PROVISIONS", value: "all" },
  { label: "TACTICAL SHIRTS", value: "Shirt" },
  { label: "OPERATOR HATS",   value: "Hat" },
  { label: "HEAVY HOODIES",   value: "Hoodie" },
  { label: "ACCESSORIES",     value: "Accessory" },
];

const sizeOptions = ["SM", "MD", "LG", "XL", "2XL", "3XL"];

// Derive unique swatches across the full collection, deduplicated by name
const allSwatches = Array.from(
  new Map(
    apparel.flatMap((a) => a.colorSwatches).map((s) => [s.name, s])
  ).values()
);

// ─── Sidebar filter section wrapper ─────────────────────────────────────────

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className="font-display text-[10px] font-semibold uppercase text-muted-foreground/60"
        style={{ letterSpacing: "0.18em" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ApparelPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSizes, setSelectedSizes]       = useState<string[]>([]);
  const [selectedColors, setSelectedColors]     = useState<string[]>([]);

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function toggleColor(name: string) {
    setSelectedColors((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }

  const filtered = apparel.filter((a) => {
    if (selectedCategory !== "all" && a.apparelType !== selectedCategory)
      return false;
    if (
      selectedSizes.length > 0 &&
      !selectedSizes.some(
        (s) => a.sizes.includes(s) || a.sizes.includes("One Size")
      )
    )
      return false;
    if (
      selectedColors.length > 0 &&
      !selectedColors.some((c) => a.colorSwatches.some((sw) => sw.name === c))
    )
      return false;
    return true;
  });

  const inStockCount = apparel.filter(
    (a) => a.status === "in_stock" || a.status === "low_stock"
  ).length;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="topo-bg bg-surface-container py-16">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <span
                className="font-display text-[10px] font-semibold uppercase text-primary"
                style={{ letterSpacing: "0.18em" }}
              >
                Mission Ready Gear
              </span>
              <Separator orientation="vertical" className="h-3 bg-border/40" />
              <span
                className="font-display text-[10px] font-semibold uppercase text-accent/70"
                style={{ letterSpacing: "0.18em" }}
              >
                Operational / In-Stock
              </span>
            </div>
            <h1
              className="font-display font-bold uppercase text-foreground leading-none"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                letterSpacing: "-0.03em",
              }}
            >
              PROVISIONS &amp;
              <br />
              <span className="text-primary">APPAREL</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Designed for the range, refined for the street. Our apparel is
              constructed with the same uncompromising standards as our
              hardware. High-durability fabrics meet ergonomic tactical cuts.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main: sidebar + grid ─────────────────────────────── */}
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
        <div className="flex gap-10 py-10 items-start">

          {/* ── Sidebar ──────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-8 w-52 shrink-0 sticky top-20">
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal className="size-3.5 text-primary" />
              <span
                className="font-display text-[10px] font-semibold uppercase text-foreground"
                style={{ letterSpacing: "0.18em" }}
              >
                FILTERS
              </span>
            </div>

            {/* Category */}
            <FilterSection label="Category">
              <div className="flex flex-col gap-0">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedCategory(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase text-left transition-colors ${
                      selectedCategory === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container text-muted-foreground hover:text-foreground hover:bg-surface-container-high"
                    }`}
                    style={{ letterSpacing: "0.1em" }}
                  >
                    <span>{opt.label}</span>
                    {selectedCategory === opt.value && opt.value === "all" && (
                      <span className="text-[9px] opacity-60">
                        {apparel.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </FilterSection>

            <Separator className="bg-border/20" />

            {/* Chassis Size */}
            <FilterSection label="Chassis Size">
              <div className="grid grid-cols-3 gap-1">
                {sizeOptions.map((size) => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`h-8 text-[10px] font-semibold uppercase transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-container text-muted-foreground hover:text-foreground hover:bg-surface-container-high"
                      }`}
                      style={{ letterSpacing: "0.08em" }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {selectedSizes.length > 0 && (
                <button
                  onClick={() => setSelectedSizes([])}
                  className="text-[10px] uppercase text-muted-foreground/60 hover:text-muted-foreground text-left transition-colors"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Clear sizes ×
                </button>
              )}
            </FilterSection>

            <Separator className="bg-border/20" />

            {/* Finish / Color */}
            <FilterSection label="Finish / Color">
              <div className="flex flex-wrap gap-2">
                {allSwatches.map((swatch) => {
                  const active = selectedColors.includes(swatch.name);
                  return (
                    <button
                      key={swatch.name}
                      onClick={() => toggleColor(swatch.name)}
                      title={swatch.name}
                      aria-label={swatch.name}
                      aria-pressed={active}
                      className={`relative size-7 transition-transform hover:scale-110 ${
                        active ? "scale-110" : ""
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {active && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="size-3"
                            viewBox="0 0 10 8"
                            fill="none"
                          >
                            <path
                              d="M1 4l3 3 5-6"
                              stroke={
                                swatch.hex === "#1c1c1c" ||
                                swatch.hex === "#1a2744" ||
                                swatch.hex === "#3d3d3d" ||
                                swatch.hex === "#4a5240"
                                  ? "#decd99"
                                  : "#231b00"
                              }
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                      {/* Gold outline ring when active */}
                      {active && (
                        <span className="absolute -inset-0.5 outline outline-1 outline-primary pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Swatch legend */}
              <div className="flex flex-col gap-1 mt-1">
                {allSwatches.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => toggleColor(s.name)}
                    className={`flex items-center gap-2 text-[10px] uppercase text-left transition-colors ${
                      selectedColors.includes(s.name)
                        ? "text-foreground"
                        : "text-muted-foreground/60 hover:text-muted-foreground"
                    }`}
                    style={{ letterSpacing: "0.08em" }}
                  >
                    <span
                      className="size-2 shrink-0"
                      style={{ backgroundColor: s.hex }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
              {selectedColors.length > 0 && (
                <button
                  onClick={() => setSelectedColors([])}
                  className="text-[10px] uppercase text-muted-foreground/60 hover:text-muted-foreground text-left transition-colors mt-1"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Clear colors ×
                </button>
              )}
            </FilterSection>
          </aside>

          {/* ── Product grid ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Result count + active chips */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {filtered.length}
                </span>{" "}
                result{filtered.length !== 1 ? "s" : ""}
              </p>

              {selectedSizes.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container text-[10px] uppercase text-primary"
                >
                  {s}
                  <button
                    onClick={() => toggleSize(s)}
                    className="text-muted-foreground hover:text-foreground ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              {selectedColors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container text-[10px] uppercase text-primary"
                >
                  {c}
                  <button
                    onClick={() => toggleColor(c)}
                    className="text-muted-foreground hover:text-foreground ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              {(selectedSizes.length > 0 || selectedColors.length > 0 || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedSizes([]);
                    setSelectedColors([]);
                  }}
                  className="text-[10px] uppercase text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Clear all ×
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-32 text-center">
                <p
                  className="font-display text-lg font-bold uppercase text-muted-foreground"
                  style={{ letterSpacing: "0.05em" }}
                >
                  NO RESULTS
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedSizes([]);
                    setSelectedColors([]);
                  }}
                  className="mt-2 text-xs uppercase text-primary hover:text-accent transition-colors"
                  style={{ letterSpacing: "0.1em" }}
                >
                  CLEAR ALL FILTERS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => (
                  <ProductCard key={item.slug} product={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Elite Operator Program ───────────────────────────── */}
      <section className="bg-surface-container py-20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="max-w-xl">
            <Mail className="size-8 text-primary mb-6" />
            <p
              className="font-display text-xs font-semibold uppercase text-primary mb-3"
              style={{ letterSpacing: "0.18em" }}
            >
              Elite Operator Program
            </p>
            <h2
              className="font-display text-2xl font-bold uppercase text-foreground mb-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              EARLY ACCESS.
              <br />
              EXCLUSIVE DISCOUNTS.
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Sign up for early access to limited edition drops, tactical
              training content, and exclusive hardware discounts. No spam — just
              intel when it matters.
            </p>
            <form className="flex gap-0" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="YOUR EMAIL ADDRESS"
                className="flex-1 bg-surface-container-high border-0 border-b border-border/40 rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground placeholder:text-muted-foreground/40 placeholder:text-[11px] text-xs"
                style={{ letterSpacing: "0.08em" }}
              />
              <Button
                type="submit"
                className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 px-6 text-xs shrink-0"
                style={{ letterSpacing: "0.1em" }}
              >
                JOIN
              </Button>
            </form>
            <p className="mt-4 text-[10px] text-muted-foreground/40" style={{ letterSpacing: "0.06em" }}>
              {inStockCount} items currently in stock · Free shipping on orders over $75
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
