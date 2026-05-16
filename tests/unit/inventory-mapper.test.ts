import { describe, expect, it } from "vitest"

import { fromAmplifyRecord, toAmplifyCreateInput, toAmplifyUpdateInput } from "@/lib/inventory/mapper"
import type { InventoryItem } from "@/lib/types/inventory"

function makeInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: "item-1",
    itemType: "FIREARM",
    status: "AVAILABLE",
    name: "Test Rifle",
    price: 1299,
    quantity: 1,
    taxMode: "DEFAULT",
    sourceSystem: "MANUAL",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    firearm: {
      finish: "Matte Black",
      requiresFflTransfer: true,
    },
    ...overrides,
  }
}

describe("inventory mapper finish field", () => {
  it("maps firearm finish from Amplify condition into the UI model", () => {
    const record = {
      id: "item-1",
      itemType: "FIREARM",
      title: "Test Rifle",
      status: "AVAILABLE",
      unitPrice: 1299,
      quantity: 1,
      taxMode: "DEFAULT",
      sourceSystem: "MANUAL",
      condition: "Matte Black",
      fflRequired: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as Parameters<typeof fromAmplifyRecord>[0]

    const item = fromAmplifyRecord(record)

    expect(item.firearm?.finish).toBe("Matte Black")
  })

  it("maps optional firearm finish into Amplify condition on create", () => {
    const input = toAmplifyCreateInput(makeInventoryItem())

    expect(input.condition).toBe("Matte Black")
  })

  it("preserves omitted firearm finish as undefined on update", () => {
    const input = toAmplifyUpdateInput(
      makeInventoryItem({
        firearm: {
          requiresFflTransfer: true,
        },
      }),
    )

    expect(input.condition).toBeUndefined()
  })

  it("round-trips apparel variant price adjustments", () => {
    const inventoryItem = makeInventoryItem({
      itemType: "APPAREL",
      firearm: undefined,
      price: 28,
      apparel: {
        apparelType: "Shirt",
        material: "Cotton",
        variants: [
          {
            id: "variant-xl",
            size: "XL",
            color: "Black",
            sku: "TEE-XL-BLK",
            quantity: 4,
            priceAdjustment: 2,
          },
        ],
      },
    })

    const createInput = toAmplifyCreateInput(inventoryItem)
    expect(createInput.apparelVariants).toContain("\"priceAdjustment\":2")

    const mapped = fromAmplifyRecord({
      id: "item-1",
      itemType: "APPAREL",
      title: "Test Rifle",
      status: "AVAILABLE",
      unitPrice: 28,
      quantity: 4,
      taxMode: "DEFAULT",
      sourceSystem: "MANUAL",
      category: "Shirt",
      material: "Cotton",
      apparelVariants:
        '[{"id":"variant-xl","size":"XL","color":"Black","sku":"TEE-XL-BLK","quantity":4,"priceAdjustment":2}]',
      fflRequired: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as Parameters<typeof fromAmplifyRecord>[0])

    expect(mapped.apparel?.variants?.[0]?.priceAdjustment).toBe(2)
  })

  it("normalizes legacy ammo categories when reading Amplify records", () => {
    const item = fromAmplifyRecord({
      id: "ammo-1",
      itemType: "AMMUNITION",
      category: "Ammo",
      title: "9mm Ball",
      status: "AVAILABLE",
      unitPrice: 12,
      quantity: 50,
      taxMode: "DEFAULT",
      sourceSystem: "ROCPAY",
      fflRequired: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as Parameters<typeof fromAmplifyRecord>[0])

    expect(item.category).toBe("Ammunition")
  })

  it("normalizes ammunition categories when writing Amplify records", () => {
    const input = toAmplifyCreateInput(
      makeInventoryItem({
        itemType: "AMMUNITION",
        firearm: undefined,
        name: "9mm Ball",
        category: "Ammo",
        price: 12,
        quantity: 50,
      }),
    )

    expect(input.category).toBe("Ammunition")
  })
})
