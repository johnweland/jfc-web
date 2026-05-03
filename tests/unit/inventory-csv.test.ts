import { beforeEach, describe, expect, it, vi } from "vitest"
import Papa from "papaparse"

import { exportInventoryToFflSafeCsv, parseFflSafeCsv } from "@/lib/inventory/csv/fflsafe"
import { exportInventoryToRocPayCsv, parseRocPayInventoryCsv } from "@/lib/inventory/csv/rocpay"
import { FFLSAFE_HEADERS, ROCPAY_HEADERS } from "@/lib/inventory/csv/types"
import type { InventoryItem } from "@/lib/types/inventory"

const NOW = new Date("2026-05-02T12:00:00.000Z")

function buildInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: overrides.id ?? "inv-1",
    itemType: overrides.itemType ?? "ACCESSORY",
    status: overrides.status ?? "AVAILABLE",
    name: overrides.name ?? "Range Bag",
    category: overrides.category ?? "Gear",
    description: overrides.description ?? "Durable bag",
    manufacturer: overrides.manufacturer,
    brand: overrides.brand,
    model: overrides.model,
    sku: overrides.sku ?? "SKU-1",
    upc: overrides.upc,
    price: overrides.price ?? 25,
    cost: overrides.cost,
    quantity: overrides.quantity ?? 4,
    location: overrides.location ?? "Shelf A",
    taxMode: overrides.taxMode ?? "DEFAULT",
    customTaxRate: overrides.customTaxRate,
    sourceSystem: overrides.sourceSystem ?? "MANUAL",
    sourceId: overrides.sourceId,
    importBatchId: overrides.importBatchId,
    firearm: overrides.firearm,
    apparel: overrides.apparel,
    images: overrides.images,
    createdAt: overrides.createdAt ?? NOW.toISOString(),
    updatedAt: overrides.updatedAt ?? NOW.toISOString(),
  }
}

describe("RocPay CSV utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  it("validates required RocPay headers", () => {
    const preview = parseRocPayInventoryCsv("SKU,DESCRIPTION\nABC,Test")

    expect(preview.missingHeaders).toEqual(ROCPAY_HEADERS.slice(2))
    expect(preview.rows[0]?.errors[0]).toContain("Missing required RocPay headers")
  })

  it("normalizes RocPay rows into inventory items", () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'GLK-19,Compact 9mm,Firearm,2,425.00,Yes,Yes,NO,-,Active,"Glock 19",,',
    ].join("\n")

    const preview = parseRocPayInventoryCsv(csv)
    const row = preview.rows[0]

    expect(row.errors).toEqual([])
    expect(row.item).toMatchObject({
      itemType: "FIREARM",
      status: "AVAILABLE",
      name: "Glock 19",
      sku: "GLK-19",
      cost: 425,
      price: 425,
      quantity: 2,
      taxMode: "DEFAULT",
      sourceSystem: "ROCPAY",
      sourceId: "GLK-19",
    })
    expect(row.item?.firearm?.requiresFflTransfer).toBe(true)
  })

  it("flags RocPay firearms that are missing bound-book details", () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'GLK-19,Compact 9mm,Firearm,1,425.00,Yes,Yes,NO,-,Active,"Glock 19",,',
    ].join("\n")

    const preview = parseRocPayInventoryCsv(csv)

    expect(preview.rows[0]?.warnings).toContain("RocPay firearm row is missing a serial number.")
    expect(preview.rows[0]?.warnings).toContain(
      "RocPay firearm row is missing manufacturer, model, or caliber details.",
    )
  })

  it("preserves RocPay export column order and values", () => {
    const csv = exportInventoryToRocPayCsv([
      buildInventoryItem({
        name: "Glock 19",
        sku: "GLK-19",
        description: "Compact 9mm",
        category: "Firearm",
        quantity: 2,
        cost: 425,
        status: "AVAILABLE",
      }),
    ])

    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })
    expect(parsed.meta.fields).toEqual([...ROCPAY_HEADERS])
    const lines = csv.split("\n")
    expect(lines[1]).toContain("GLK-19")
    expect(lines[1]).toContain("Active")
    expect(lines[1]).toContain("425.00")
  })

  it("ignores empty rows", () => {
    const csv = [ROCPAY_HEADERS.join(","), "", ",,,,,,,,,,,,", "SKU-1,Item,Gear,1,10.00,Yes,Yes,NO,-,Active,Item,,"].join("\n")

    const preview = parseRocPayInventoryCsv(csv)

    expect(preview.summary.totalRows).toBe(1)
  })

  it("surfaces invalid numeric values as errors", () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'SKU-1,Item,Gear,abc,xyz,Yes,Yes,NO,-,Active,Item,,',
    ].join("\n")

    const preview = parseRocPayInventoryCsv(csv)

    expect(preview.rows[0]?.errors).toEqual([
      'Quantity "abc" is not a valid whole number.',
      'UNITCOST "xyz" is not a valid number.',
    ])
  })

  it('defaults "N/A" numeric values to 0 instead of erroring', () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'SKU-1,Item,Other,N/A,N/A,Yes,Yes,NO,-,Active,Item,,',
    ].join("\n")

    const preview = parseRocPayInventoryCsv(csv)

    expect(preview.rows[0]?.errors).toEqual([])
    expect(preview.rows[0]?.item).toMatchObject({
      itemType: "OTHER",
      quantity: 0,
      cost: 0,
      price: 0,
    })
    expect(preview.rows[0]?.warnings).toContain('Quantity "N/A" defaulted to 0.')
    expect(preview.rows[0]?.warnings).toContain('UNITCOST "N/A" defaulted to 0.')
  })

  it("maps service categories to SERVICES and exports them as non-inventory", () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'SVC-1,Transfer fee,Services,1,25.00,Yes,Yes,NO,-,Active,Transfer Fee,,',
    ].join("\n")

    const preview = parseRocPayInventoryCsv(csv)
    expect(preview.rows[0]?.item).toMatchObject({
      itemType: "SERVICES",
      category: "Services",
    })

    const exported = exportInventoryToRocPayCsv([
      buildInventoryItem({
        itemType: "SERVICES",
        sku: "SVC-1",
        name: "Transfer Fee",
        category: "Services",
        cost: 25,
      }),
    ])

    expect(exported).toContain("No")
  })

  it("maps APPAREL and CLOTHES categories to APPAREL", () => {
    const apparelCsv = [
      ROCPAY_HEADERS.join(","),
      'HAT-1,Shop hat,APPAREL,3,15.00,Yes,Yes,NO,-,Active,Logo Hat,,',
    ].join("\n")

    const clothesCsv = [
      ROCPAY_HEADERS.join(","),
      'TSHIRT-1,Shop tee,CLOTHES,5,20.00,Yes,Yes,NO,-,Active,Logo Tee,,',
    ].join("\n")

    const apparelPreview = parseRocPayInventoryCsv(apparelCsv)
    const clothesPreview = parseRocPayInventoryCsv(clothesCsv)

    expect(apparelPreview.rows[0]?.item).toMatchObject({
      itemType: "APPAREL",
      category: "APPAREL",
    })
    expect(clothesPreview.rows[0]?.item).toMatchObject({
      itemType: "APPAREL",
      category: "CLOTHES",
    })
  })

  it("aliases ammo categories to AMMUNITION on import", () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'AMMO-9MM,9mm ball,Ammo,50,12.00,Yes,Yes,NO,-,Active,9mm FMJ,,',
    ].join("\n")

    const preview = parseRocPayInventoryCsv(csv)

    expect(preview.rows[0]?.item).toMatchObject({
      itemType: "AMMUNITION",
      category: "Ammo",
      sku: "AMMO-9MM",
    })
  })

  it("detects duplicate SKUs in the file and inventory", () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'SKU-1,Item 1,Gear,1,10.00,Yes,Yes,NO,-,Active,Item 1,,',
      'SKU-1,Item 2,Gear,1,10.00,Yes,Yes,NO,-,Active,Item 2,,',
    ].join("\n")

    const existing = [buildInventoryItem({ id: "existing-1", sku: "SKU-1" })]
    const preview = parseRocPayInventoryCsv(csv, existing)

    expect(preview.rows[0]?.matchedInventoryItemId).toBe("existing-1")
    expect(preview.rows[1]?.warnings).toContain(
      'Duplicate SKU "SKU-1" appears multiple times in this CSV.',
    )
  })
})

describe("FFLSafe CSV utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  it("filters FFLSafe exports to firearms only", () => {
    const csv = exportInventoryToFflSafeCsv([
      buildInventoryItem({
        itemType: "FIREARM",
        name: "Glock 19",
        manufacturer: "Glock",
        model: "19",
        firearm: {
          serialNumber: "ABC123",
          caliber: "9mm",
          firearmType: "HANDGUN",
          requiresFflTransfer: true,
        },
      }),
      buildInventoryItem({
        id: "inv-2",
        itemType: "ACCESSORY",
        name: "Magazine",
      }),
    ])

    const lines = csv.trim().split("\n")
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain("ABC123")
    expect(lines[1]).not.toContain("Magazine")
  })

  it("preserves FFLSafe export column order and values", () => {
    const csv = exportInventoryToFflSafeCsv([
      buildInventoryItem({
        itemType: "FIREARM",
        name: "Glock 19",
        manufacturer: "Glock",
        model: "19",
        sku: "GLK-19",
        category: "Handgun",
        location: "Case 1",
        firearm: {
          serialNumber: "ABC123",
          caliber: "9mm",
          firearmType: "HANDGUN",
          requiresFflTransfer: true,
        },
      }),
    ])

    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })
    expect(parsed.meta.fields).toEqual([...FFLSAFE_HEADERS])
    const lines = csv.split("\n")
    expect(lines[1]).toContain("Glock")
    expect(lines[1]).toContain("ABC123")
    expect(lines[1]).toContain("SKU: GLK-19")
  })

  it("can parse FFLSafe rows into firearms", () => {
    const csv = [
      FFLSAFE_HEADERS.join(","),
      '"Glock",,19,ABC123,Handgun,9mm,2026-05-01,, ,,,Inbound',
    ].join("\n")

    const preview = parseFflSafeCsv(csv)

    expect(preview.rows[0]?.item).toMatchObject({
      itemType: "FIREARM",
      status: "AVAILABLE",
      manufacturer: "Glock",
      model: "19",
      sourceSystem: "FFLSAFE",
      sourceId: "ABC123",
    })
  })
})
