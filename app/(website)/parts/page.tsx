"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ui/product-card";
import { parts } from "@/lib/data/parts";

const partTypes = [
  "ALL",
  "BCG",
  "Handguard",
  "Trigger",
  "Muzzle Device",
  "Grip",
  "Buffer / Spring",
  "Lower Receiver",
  "Optic",
];

export default function PartsPage() {
  const [selectedType, setSelectedType] = useState("ALL");

  const filtered =
    selectedType === "ALL"
      ? parts
      : parts.filter((p) => p.partType === selectedType);

  return (
    <>
      {/* Hero bar */}
      <section className="bg-surface-container py-10">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="font-display text-xs font-semibold uppercase text-primary mb-1"
                style={{ letterSpacing: "0.18em" }}
              >
                Inventory
              </p>
              <h1
                className="font-display text-3xl font-bold uppercase text-foreground"
                style={{ letterSpacing: "-0.02em" }}
              >
                PARTS &amp; ACCESSORIES
              </h1>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground">
                {parts.length}
              </p>
              <p
                className="text-[10px] uppercase text-muted-foreground"
                style={{ letterSpacing: "0.1em" }}
              >
                Total SKUs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 bg-surface border-b border-border/20">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          <div className="flex flex-wrap items-center gap-2 py-4">
            {partTypes.map((type) => (
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
                {type}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-surface py-12">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-12">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <p
                className="font-display text-lg font-bold uppercase text-muted-foreground"
                style={{ letterSpacing: "0.05em" }}
              >
                NO RESULTS
              </p>
              <p className="text-sm text-muted-foreground">
                Try selecting a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((part) => (
                <ProductCard key={part.slug} product={part} />
              ))}
            </div>
          )}

          <p className="mt-12 text-xs text-muted-foreground/60 border-t border-border/20 pt-6">
            Parts and accessories ship directly to your door. Note: receivers
            and regulated components may require additional compliance steps.
          </p>
        </div>
      </section>
    </>
  );
}
