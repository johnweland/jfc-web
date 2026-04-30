"use client"

import { useState } from "react"
import Link from "next/link"
import { SlidersHorizontal } from "lucide-react"
import { ProductCard } from "@/components/ui/product-card"
import { Separator } from "@/components/ui/separator"
import type { Part } from "@/lib/data/types"

const categoryNav = [
  { label: "FIREARMS", href: "/firearms" },
  { label: "PARTS & ACCESSORIES", href: "/parts" },
  { label: "APPAREL", href: "/apparel" },
]

const KNOWN_PART_TYPES = [
  "Optic",
  "Magazine",
  "Handguard",
  "Stock / Brace",
  "BCG",
  "Trigger",
  "Muzzle Device",
  "Grip",
  "Upper Receiver",
  "Barrel",
  "Buffer / Spring",
  "Sling / Mount",
  "Light / Laser",
  "Build Kit",
  "Other",
]

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

export function PartsCatalog({ parts }: { parts: Part[] }) {
  const [selectedType, setSelectedType] = useState<string>("all")

  // Build the type filter list from known categories first, then any unseen partType values from data
  const liveTypes = Array.from(new Set(parts.map((p) => p.partType).filter(Boolean)))
  const typeOptions = [
    "all",
    ...KNOWN_PART_TYPES.filter((t) => liveTypes.includes(t)),
    ...liveTypes.filter((t) => !KNOWN_PART_TYPES.includes(t)),
  ]

  const filtered =
    selectedType === "all" ? parts : parts.filter((p) => p.partType === selectedType)

  const inStockCount = parts.filter(
    (p) => p.status === "in_stock" || p.status === "low_stock",
  ).length

  return (
    <>
      <section className="bg-surface-container py-10">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="font-display text-xs font-semibold uppercase text-primary mb-2"
                style={{ letterSpacing: "0.18em" }}
              >
                Inventory
              </p>
              <h1
                className="font-display text-4xl font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.03em" }}
              >
                PARTS &amp; ACCESSORIES
              </h1>
            </div>
            <div className="flex gap-10">
              <div className="text-right">
                <p
                  className="font-display text-3xl font-bold text-primary tabular-nums"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {String(inStockCount).padStart(2, "0")}
                </p>
                <p
                  className="text-[10px] uppercase text-muted-foreground mt-1"
                  style={{ letterSpacing: "0.12em" }}
                >
                  In Stock
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-display text-3xl font-bold text-foreground tabular-nums"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {String(parts.length).padStart(2, "0")}
                </p>
                <p
                  className="text-[10px] uppercase text-muted-foreground mt-1"
                  style={{ letterSpacing: "0.12em" }}
                >
                  Total SKUs
                </p>
              </div>
            </div>
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
                {categoryNav.map((cat) => {
                  const isActive = cat.href === "/parts"
                  return isActive ? (
                    <span
                      key={cat.label}
                      className="flex items-center justify-between px-3 py-2 bg-primary text-primary-foreground text-[11px] font-semibold uppercase"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      {cat.label}
                      <span className="text-[9px] opacity-60">{parts.length}</span>
                    </span>
                  ) : (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className="flex items-center justify-between px-3 py-2 bg-surface-container text-muted-foreground text-[11px] font-semibold uppercase hover:text-foreground hover:bg-surface-container-high transition-colors"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      {cat.label}
                    </Link>
                  )
                })}
              </div>
            </FilterSection>

            <Separator className="bg-border/20" />

            <FilterSection label="Part Type">
              <div className="flex flex-col gap-0">
                {typeOptions.map((type) => {
                  const isActive = selectedType === type
                  const label = type === "all" ? "ALL TYPES" : type.toUpperCase()
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase text-left transition-colors ${
                        isActive
                          ? "bg-surface-container-highest text-accent"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ letterSpacing: "0.1em" }}
                    >
                      <span>{label}</span>
                      {isActive && (
                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </FilterSection>
          </aside>

          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* Mobile filter strip */}
            <div className="flex lg:hidden flex-wrap items-center gap-2">
              {typeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 text-[10px] font-semibold uppercase transition-colors ${
                    selectedType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-container text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ letterSpacing: "0.1em" }}
                >
                  {type === "all" ? "ALL" : type}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <p
                className="text-[10px] uppercase text-muted-foreground/50"
                style={{ letterSpacing: "0.12em" }}
              >
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </p>
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
                  Try selecting a different part type.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((part) => (
                  <ProductCard key={part.slug} product={part} />
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-muted-foreground/60 border-t border-border/20 pt-6">
              Parts and accessories ship directly to your door. Note: receivers and regulated
              components may require additional compliance steps.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
