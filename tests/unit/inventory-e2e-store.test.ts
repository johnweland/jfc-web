import { beforeEach, describe, expect, it } from "vitest"

import {
  importE2eInventoryItems,
  listE2eInventoryItems,
  resetE2eInventoryItems,
  setE2eInventoryItems,
} from "@/lib/inventory/e2e-store"
import type { InventoryItem } from "@/lib/types/inventory"

function buildItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: overrides.id ?? "inv-1",
    itemType: overrides.itemType ?? "PART",
    status: overrides.status ?? "AVAILABLE",
    name: overrides.name ?? "Mock Item",
    category: overrides.category ?? "Parts",
    description: overrides.description,
    manufacturer: overrides.manufacturer,
    brand: overrides.brand,
    model: overrides.model,
    sku: overrides.sku ?? "SKU-1",
    upc: overrides.upc,
    price: overrides.price ?? 10,
    cost: overrides.cost,
    quantity: overrides.quantity ?? 1,
    location: overrides.location,
    taxMode: overrides.taxMode ?? "DEFAULT",
    customTaxRate: overrides.customTaxRate,
    sourceSystem: overrides.sourceSystem ?? "ROCPAY",
    sourceId: overrides.sourceId ?? "SKU-1",
    importBatchId: overrides.importBatchId,
    firearm: overrides.firearm,
    apparel: overrides.apparel,
    images: overrides.images,
    createdAt: overrides.createdAt ?? "2026-05-02T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-05-02T00:00:00.000Z",
  }
}

describe("inventory e2e store", () => {
  beforeEach(() => {
    resetE2eInventoryItems()
  })

  it("sets and lists items", () => {
    setE2eInventoryItems([buildItem(), buildItem({ id: "inv-2", sku: "SKU-2", sourceId: "SKU-2" })])

    expect(listE2eInventoryItems()).toHaveLength(2)
  })

  it("imports rows and skips duplicates when configured", () => {
    setE2eInventoryItems([buildItem()])

    const result = importE2eInventoryItems(
      [buildItem(), buildItem({ id: "inv-2", sku: "SKU-2", sourceId: "SKU-2" })],
      "skip-existing",
    )

    expect(result.created).toBe(1)
    expect(result.skipped).toHaveLength(1)
    expect(listE2eInventoryItems()).toHaveLength(2)
  })

  it("updates duplicates when configured", () => {
    setE2eInventoryItems([buildItem({ quantity: 1 })])

    const result = importE2eInventoryItems(
      [buildItem({ quantity: 7, updatedAt: "2026-05-03T00:00:00.000Z" })],
      "update-existing",
    )

    expect(result.updated).toBe(1)
    expect(listE2eInventoryItems()[0]?.quantity).toBe(7)
  })
})
