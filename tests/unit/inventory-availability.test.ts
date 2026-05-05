import { describe, expect, it } from "vitest"

import {
  getAvailableQuantity,
  getEffectiveStatus,
  getUnitCounts,
} from "@/lib/inventory/availability"
import type { InventoryItem, InventoryUnit } from "@/lib/types/inventory"

function makeUnit(overrides: Partial<InventoryUnit> = {}): InventoryUnit {
  return {
    id: crypto.randomUUID(),
    inventoryItemId: "item-1",
    serialNumber: "SN-001",
    status: "AVAILABLE",
    sourceType: "MANUAL",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function makeItem(
  overrides: Partial<Pick<InventoryItem, "isSerialized" | "quantity" | "status">>,
): Pick<InventoryItem, "isSerialized" | "quantity" | "status"> {
  return {
    isSerialized: false,
    quantity: 0,
    status: "AVAILABLE",
    ...overrides,
  }
}

describe("getUnitCounts", () => {
  it("returns all-zero counts for undefined", () => {
    const counts = getUnitCounts(undefined)
    expect(counts.total).toBe(0)
    expect(counts.AVAILABLE).toBe(0)
  })

  it("returns all-zero counts for empty array", () => {
    const counts = getUnitCounts([])
    expect(counts.total).toBe(0)
  })

  it("counts units by status correctly", () => {
    const units = [
      makeUnit({ status: "AVAILABLE" }),
      makeUnit({ status: "AVAILABLE" }),
      makeUnit({ status: "SOLD" }),
      makeUnit({ status: "RESERVED" }),
    ]
    const counts = getUnitCounts(units)
    expect(counts.total).toBe(4)
    expect(counts.AVAILABLE).toBe(2)
    expect(counts.SOLD).toBe(1)
    expect(counts.RESERVED).toBe(1)
    expect(counts.TRANSFERRED).toBe(0)
  })

  it("counts all 8 statuses", () => {
    const statuses = [
      "AVAILABLE", "RESERVED", "SOLD", "TRANSFERRED",
      "CONSIGNED", "RETURNED", "LOST_DAMAGED", "REMOVED",
    ] as const
    const units = statuses.map((status) => makeUnit({ status }))
    const counts = getUnitCounts(units)
    expect(counts.total).toBe(8)
    for (const status of statuses) {
      expect(counts[status]).toBe(1)
    }
  })
})

describe("getAvailableQuantity", () => {
  it("returns item.quantity for non-serialized items", () => {
    const item = makeItem({ isSerialized: false, quantity: 12 })
    expect(getAvailableQuantity(item)).toBe(12)
  })

  it("returns 0 for non-serialized items with quantity 0", () => {
    const item = makeItem({ isSerialized: false, quantity: 0 })
    expect(getAvailableQuantity(item)).toBe(0)
  })

  it("returns 0 for serialized items when no units are provided", () => {
    const item = makeItem({ isSerialized: true, quantity: 5 })
    expect(getAvailableQuantity(item)).toBe(0)
    expect(getAvailableQuantity(item, undefined)).toBe(0)
  })

  it("returns AVAILABLE unit count for serialized items", () => {
    const item = makeItem({ isSerialized: true, quantity: 99 })
    const units = [
      makeUnit({ status: "AVAILABLE" }),
      makeUnit({ status: "AVAILABLE" }),
      makeUnit({ status: "SOLD" }),
    ]
    expect(getAvailableQuantity(item, units)).toBe(2)
  })

  it("returns 0 for serialized items with all units sold", () => {
    const item = makeItem({ isSerialized: true, quantity: 1 })
    const units = [makeUnit({ status: "SOLD" }), makeUnit({ status: "SOLD" })]
    expect(getAvailableQuantity(item, units)).toBe(0)
  })

  it("returns 0 for serialized items with empty units array", () => {
    const item = makeItem({ isSerialized: true, quantity: 5 })
    expect(getAvailableQuantity(item, [])).toBe(0)
  })
})

describe("getEffectiveStatus", () => {
  it("returns item status unchanged when not serialized", () => {
    const item = makeItem({ isSerialized: false, status: "AVAILABLE" })
    const units = [makeUnit({ status: "SOLD" })]
    expect(getEffectiveStatus(item, units)).toBe("AVAILABLE")
  })

  it("returns item status when no units", () => {
    const item = makeItem({ isSerialized: true, status: "DRAFT" })
    expect(getEffectiveStatus(item)).toBe("DRAFT")
    expect(getEffectiveStatus(item, [])).toBe("DRAFT")
  })

  it("returns AVAILABLE when any unit is AVAILABLE", () => {
    const item = makeItem({ isSerialized: true, status: "SOLD" })
    const units = [makeUnit({ status: "SOLD" }), makeUnit({ status: "AVAILABLE" })]
    expect(getEffectiveStatus(item, units)).toBe("AVAILABLE")
  })

  it("returns RESERVED when no AVAILABLE but some RESERVED", () => {
    const item = makeItem({ isSerialized: true, status: "AVAILABLE" })
    const units = [makeUnit({ status: "RESERVED" }), makeUnit({ status: "SOLD" })]
    expect(getEffectiveStatus(item, units)).toBe("RESERVED")
  })

  it("returns SOLD when all units are SOLD", () => {
    const item = makeItem({ isSerialized: true, status: "AVAILABLE" })
    const units = [makeUnit({ status: "SOLD" }), makeUnit({ status: "SOLD" })]
    expect(getEffectiveStatus(item, units)).toBe("SOLD")
  })

  it("returns ARCHIVED when all units are REMOVED or TRANSFERRED", () => {
    const item = makeItem({ isSerialized: true, status: "AVAILABLE" })
    const units = [makeUnit({ status: "REMOVED" })]
    expect(getEffectiveStatus(item, units)).toBe("ARCHIVED")
  })
})
