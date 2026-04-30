"use client"

import { useState } from "react"
import { Mail, SlidersHorizontal } from "lucide-react"
import { ProductCard } from "@/components/ui/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Apparel } from "@/lib/data/types"

const sizeOptions = ["SM", "MD", "LG", "XL", "2XL", "3XL", "One Size"]

function FilterSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
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
  )
}

export function ApparelCatalog({ apparel }: { apparel: Apparel[] }) {
  const categoryOptions = [
    { label: "ALL PROVISIONS", value: "all" },
    ...Array.from(new Set(apparel.map((item) => item.apparelType))).map((type) => ({
      label: type.toUpperCase() === "SHIRT" ? "TACTICAL SHIRTS" : type.toUpperCase(),
      value: type,
    })),
  ]

  const allSwatches = Array.from(
    new Map(
      apparel.flatMap((item) => item.colorSwatches).map((swatch) => [swatch.name, swatch]),
    ).values(),
  )

  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((entry) => entry !== size) : [...prev, size],
    )
  }

  function toggleColor(name: string) {
    setSelectedColors((prev) =>
      prev.includes(name) ? prev.filter((entry) => entry !== name) : [...prev, name],
    )
  }

  const filtered = apparel.filter((item) => {
    if (selectedCategory !== "all" && item.apparelType !== selectedCategory) return false
    if (
      selectedSizes.length > 0 &&
      !selectedSizes.some((size) => item.sizes.includes(size) || item.sizes.includes("One Size"))
    ) {
      return false
    }
    if (
      selectedColors.length > 0 &&
      !selectedColors.some((color) => item.colorSwatches.some((swatch) => swatch.name === color))
    ) {
      return false
    }
    return true
  })

  const inStockCount = apparel.filter(
    (item) => item.status === "in_stock" || item.status === "low_stock",
  ).length

  return (
    <>
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
              Designed for the range, refined for the street. Our apparel is constructed with the
              same uncompromising standards as our hardware. High-durability fabrics meet
              ergonomic tactical cuts.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
        <div className="flex gap-10 py-10 items-start">
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
                      <span className="text-[9px] opacity-60">{apparel.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </FilterSection>

            <Separator className="bg-border/20" />

            <FilterSection label="Chassis Size">
              <div className="grid grid-cols-3 gap-1">
                {sizeOptions.map((size) => {
                  const active = selectedSizes.includes(size)
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
                  )
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

            <FilterSection label="Finish / Color">
              <div className="flex flex-wrap gap-2">
                {allSwatches.map((swatch) => {
                  const active = selectedColors.includes(swatch.name)
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
                          <svg className="size-3" viewBox="0 0 10 8" fill="none">
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
                      {active && (
                        <span className="absolute -inset-0.5 outline outline-1 outline-primary pointer-events-none" />
                      )}
                    </button>
                  )
                })}
              </div>
              {selectedColors.length > 0 && (
                <button
                  onClick={() => setSelectedColors([])}
                  className="text-[10px] uppercase text-muted-foreground/60 hover:text-muted-foreground text-left transition-colors"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Clear colors ×
                </button>
              )}
            </FilterSection>
          </aside>

          <div className="flex-1 flex flex-col gap-8 min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p
                  className="font-display text-[10px] font-semibold uppercase text-primary mb-1"
                  style={{ letterSpacing: "0.18em" }}
                >
                  Active Collection
                </p>
                <p className="text-sm text-muted-foreground">
                  {filtered.length} item{filtered.length === 1 ? "" : "s"} matched. {inStockCount}{" "}
                  ready to ship.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <label
                  className="font-display text-[10px] font-semibold uppercase text-muted-foreground/60 block mb-2"
                  style={{ letterSpacing: "0.18em" }}
                >
                  Notify Me
                </label>
                <div className="flex gap-2">
                  <Input placeholder="Email for restocks" className="rounded-none" />
                  <Button className="gradient-primary text-primary-foreground rounded-none px-4">
                    <Mail className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-24 text-center">
                <p
                  className="font-display text-lg font-bold uppercase text-muted-foreground"
                  style={{ letterSpacing: "0.05em" }}
                >
                  NO RESULTS
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your size, color, or category filters.
                </p>
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
    </>
  )
}
