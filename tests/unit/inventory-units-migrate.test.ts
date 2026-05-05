import { beforeEach, describe, expect, it, vi } from "vitest"

import { migrateInventoryUnits } from "@/lib/inventory/migrate-units"
import type { InventoryItem, InventoryUnit } from "@/lib/types/inventory"

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockItems: InventoryItem[] = []
const mockUnits: Map<string, InventoryUnit[]> = new Map()
const createdUnits: InventoryUnit[] = []

vi.mock("@/lib/inventory/data", () => ({
  listInventory: async () => [...mockItems],
}))

vi.mock("@/lib/inventory/units/data", () => ({
  listInventoryUnits: async (itemId?: string) => {
    if (!itemId) return [...createdUnits]
    return mockUnits.get(itemId) ?? []
  },
  createInventoryUnit: async (input: Omit<InventoryUnit, "id" | "createdAt" | "updatedAt">) => {
    const unit: InventoryUnit = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input,
    } as InventoryUnit
    const existing = mockUnits.get(input.inventoryItemId) ?? []
    existing.push(unit)
    mockUnits.set(input.inventoryItemId, existing)
    createdUnits.push(unit)
    return unit
  },
}))

// server-only guard
vi.mock("server-only", () => ({}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NOW = "2026-01-01T00:00:00.000Z"

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    itemType: "FIREARM",
    status: "AVAILABLE",
    name: "Test Firearm",
    price: 500,
    quantity: 1,
    taxMode: "DEFAULT",
    sourceSystem: "MANUAL",
    isSerialized: true,
    firearm: { serialNumber: "SN-001", requiresFflTransfer: true },
    images: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("migrateInventoryUnits", () => {
  beforeEach(() => {
    mockItems.length = 0
    mockUnits.clear()
    createdUnits.length = 0
  })

  it("creates one unit for a serialized firearm with no existing units", async () => {
    const item = makeItem({ firearm: { serialNumber: "ABC123", requiresFflTransfer: true } })
    mockItems.push(item)

    const result = await migrateInventoryUnits()

    expect(result.scanned).toBe(1)
    expect(result.created).toBe(1)
    expect(result.skipped).toBe(0)
    expect(result.alreadyMigrated).toBe(0)

    const units = mockUnits.get(item.id) ?? []
    expect(units).toHaveLength(1)
    expect(units[0].serialNumber).toBe("ABC123")
    expect(units[0].status).toBe("AVAILABLE")
  })

  it("uses a fallback serial when the item has no serialNumber", async () => {
    const item = makeItem({
      id: "abc12345-1234-1234-1234-123456789012",
      firearm: { requiresFflTransfer: true },
    })
    mockItems.push(item)

    await migrateInventoryUnits()

    const units = mockUnits.get(item.id) ?? []
    expect(units).toHaveLength(1)
    expect(units[0].serialNumber).toMatch(/^MIGRATED-/)
  })

  it("skips non-serialized, non-firearm items", async () => {
    const accessory = makeItem({
      itemType: "ACCESSORY",
      isSerialized: false,
      firearm: undefined,
    })
    mockItems.push(accessory)

    const result = await migrateInventoryUnits()

    expect(result.skipped).toBe(1)
    expect(result.created).toBe(0)
    expect(mockUnits.size).toBe(0)
  })

  it("skips items that already have a unit (idempotent)", async () => {
    const item = makeItem()
    mockItems.push(item)
    const existingUnit: InventoryUnit = {
      id: "unit-existing",
      inventoryItemId: item.id,
      serialNumber: "SN-001",
      status: "AVAILABLE",
      sourceType: "MANUAL",
      createdAt: NOW,
      updatedAt: NOW,
    }
    mockUnits.set(item.id, [existingUnit])

    const result = await migrateInventoryUnits()

    expect(result.alreadyMigrated).toBe(1)
    expect(result.created).toBe(0)
    expect(mockUnits.get(item.id)).toHaveLength(1)
  })

  it("is idempotent — running twice produces the same unit set", async () => {
    const item = makeItem({ firearm: { serialNumber: "DUP-SN", requiresFflTransfer: true } })
    mockItems.push(item)

    const first = await migrateInventoryUnits()
    const second = await migrateInventoryUnits()

    expect(first.created).toBe(1)
    expect(second.created).toBe(0)
    expect(second.alreadyMigrated).toBe(1)
    expect(mockUnits.get(item.id)).toHaveLength(1)
  })

  it("maps item status SOLD to unit status SOLD", async () => {
    const item = makeItem({ status: "SOLD" })
    mockItems.push(item)

    await migrateInventoryUnits()

    const units = mockUnits.get(item.id) ?? []
    expect(units[0].status).toBe("SOLD")
  })

  it("maps item status RESERVED to unit status RESERVED", async () => {
    const item = makeItem({ status: "RESERVED" })
    mockItems.push(item)

    await migrateInventoryUnits()

    const units = mockUnits.get(item.id) ?? []
    expect(units[0].status).toBe("RESERVED")
  })

  it("maps item status ARCHIVED to unit status REMOVED", async () => {
    const item = makeItem({ status: "ARCHIVED" })
    mockItems.push(item)

    await migrateInventoryUnits()

    const units = mockUnits.get(item.id) ?? []
    expect(units[0].status).toBe("REMOVED")
  })

  it("maps item status DRAFT to unit status AVAILABLE", async () => {
    const item = makeItem({ status: "DRAFT" })
    mockItems.push(item)

    await migrateInventoryUnits()

    const units = mockUnits.get(item.id) ?? []
    expect(units[0].status).toBe("AVAILABLE")
  })

  it("infers IMPORTED sourceType for ROCPAY/FFLSAFE items", async () => {
    const rocpay = makeItem({ sourceSystem: "ROCPAY" })
    const fflsafe = makeItem({
      id: crypto.randomUUID(),
      sourceSystem: "FFLSAFE",
      firearm: { serialNumber: "FS-SN", requiresFflTransfer: true },
    })
    mockItems.push(rocpay, fflsafe)

    await migrateInventoryUnits()

    const rocpayUnit = (mockUnits.get(rocpay.id) ?? [])[0]
    const fflsafeUnit = (mockUnits.get(fflsafe.id) ?? [])[0]
    expect(rocpayUnit.sourceType).toBe("IMPORTED")
    expect(fflsafeUnit.sourceType).toBe("IMPORTED")
  })

  it("infers MANUAL sourceType for items not from an external system", async () => {
    const item = makeItem({ sourceSystem: "MANUAL" })
    mockItems.push(item)

    await migrateInventoryUnits()

    const unit = (mockUnits.get(item.id) ?? [])[0]
    expect(unit.sourceType).toBe("MANUAL")
  })

  it("handles a mix of candidates and non-candidates", async () => {
    const firearm = makeItem({ id: "fw-1" })
    const accessory = makeItem({ id: "acc-1", itemType: "ACCESSORY", isSerialized: false, firearm: undefined })
    const ammo = makeItem({ id: "ammo-1", itemType: "AMMUNITION", isSerialized: false, firearm: undefined })
    mockItems.push(firearm, accessory, ammo)

    const result = await migrateInventoryUnits()

    expect(result.scanned).toBe(3)
    expect(result.created).toBe(1)
    expect(result.skipped).toBe(2)
  })
})
