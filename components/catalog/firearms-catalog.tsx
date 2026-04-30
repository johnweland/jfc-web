"use client"

import { useState } from "react"
import Link from "next/link"
import { SlidersHorizontal } from "lucide-react"
import { ProductCard } from "@/components/ui/product-card"
import { Separator } from "@/components/ui/separator"
import type { Firearm, FirearmType } from "@/lib/data/types"

const categoryOptions = [
  { label: "FIREARMS", href: "/firearms", active: true },
  { label: "PARTS", href: "/parts", active: false },
  { label: "OPTICS", href: "/parts?type=Optic", active: false },
]

const typeOptions: { label: string; value: FirearmType | "all" }[] = [
  { label: "ALL TYPES", value: "all" },
  { label: "RIFLES", value: "rifle" },
  { label: "HANDGUNS", value: "handgun" },
  { label: "SHOTGUNS", value: "shotgun" },
  { label: "UPPERS / LOWERS", value: "receiver" },
  { label: "ACCESSORIES", value: "other" },
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

export function FirearmsCatalog({ firearms }: { firearms: Firearm[] }) {
  const [selectedType, setSelectedType] = useState<FirearmType | "all">("all")
  const [fflRegulated, setFflRegulated] = useState(false)
  const [directShipping, setDirectShipping] = useState(false)

  const filtered = firearms.filter((firearm) => {
    if (selectedType !== "all" && firearm.type !== selectedType) return false

    if (fflRegulated || directShipping) {
      const matchesFFL = fflRegulated && firearm.requiresFFL
      const matchesDirect = directShipping && !firearm.requiresFFL
      if (!matchesFFL && !matchesDirect) return false
    }

    return true
  })

  const totalUnits = firearms.reduce(
    (sum, firearm) =>
      firearm.status === "in_stock" || firearm.status === "low_stock" ? sum + 1 : sum,
    0,
  )

  return (
    <>
      <section className="bg-surface-container">
        <div className="mx-auto max-w-screen-2xl px-6 py-10 lg:px-12">
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
                PRECISION HARDWARE
              </h1>
            </div>

            <div className="flex gap-10">
              <div className="text-right">
                <p
                  className="font-display text-3xl font-bold text-primary tabular-nums"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {String(totalUnits).padStart(2, "0")}
                </p>
                <p
                  className="text-[10px] uppercase text-muted-foreground mt-1"
                  style={{ letterSpacing: "0.12em" }}
                >
                  Units In Stock
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-display text-3xl font-bold text-foreground tabular-nums"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  04
                </p>
                <p
                  className="text-[10px] uppercase text-muted-foreground mt-1"
                  style={{ letterSpacing: "0.12em" }}
                >
                  Days to Shipment
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-display text-3xl font-bold text-foreground tabular-nums"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {String(firearms.length).padStart(2, "0")}
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
                {categoryOptions.map((cat) =>
                  cat.active ? (
                    <span
                      key={cat.label}
                      className="flex items-center justify-between px-3 py-2 bg-primary text-primary-foreground text-[11px] font-semibold uppercase"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      {cat.label}
                      <span className="text-[9px] opacity-60">{firearms.length}</span>
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
                  ),
                )}
              </div>
            </FilterSection>

            <Separator className="bg-border/20" />

            <FilterSection label="Type">
              <div className="flex flex-col gap-0">
                {typeOptions.map((opt) => {
                  const isActive = selectedType === opt.value
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedType(opt.value)}
                      className={`flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase text-left transition-colors ${
                        isActive
                          ? "bg-surface-container-highest text-accent"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ letterSpacing: "0.1em" }}
                    >
                      <span>{opt.label}</span>
                      {isActive && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </FilterSection>

            <Separator className="bg-border/20" />

            <FilterSection label="Compliance">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setFflRegulated(!fflRegulated)}
                    className={`size-4 shrink-0 flex items-center justify-center border transition-colors ${
                      fflRegulated
                        ? "bg-primary border-primary"
                        : "bg-transparent border-border/40 group-hover:border-primary/60"
                    }`}
                  >
                    {fflRegulated && (
                      <svg
                        className="size-2.5 text-primary-foreground"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium uppercase transition-colors ${
                      fflRegulated ? "text-foreground" : "text-muted-foreground"
                    }`}
                    style={{ letterSpacing: "0.08em" }}
                  >
                    FFL Regulated
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setDirectShipping(!directShipping)}
                    className={`size-4 shrink-0 flex items-center justify-center border transition-colors ${
                      directShipping
                        ? "bg-primary border-primary"
                        : "bg-transparent border-border/40 group-hover:border-primary/60"
                    }`}
                  >
                    {directShipping && (
                      <svg
                        className="size-2.5 text-primary-foreground"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium uppercase transition-colors ${
                      directShipping ? "text-foreground" : "text-muted-foreground"
                    }`}
                    style={{ letterSpacing: "0.08em" }}
                  >
                    Direct Shipping
                  </span>
                </label>
              </div>
            </FilterSection>
          </aside>

          <div className="flex-1 flex flex-col gap-6 min-w-0">
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
                  Try adjusting the current filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((firearm) => (
                  <ProductCard key={firearm.slug} product={firearm} />
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-muted-foreground/60 border-t border-border/20 pt-6">
              All complete firearms require FFL transfer. Must be 21+ for handgun purchases and
              comply with all local, state, and federal laws.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
