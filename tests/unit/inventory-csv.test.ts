import { beforeEach, describe, expect, it, vi } from "vitest"
import Papa from "papaparse"

import { exportInventoryToFflSafeCsv, parseFflSafeCsv } from "@/lib/inventory/csv/fflsafe"
import { exportInventoryToRocPayCsv, parseRocPayInventoryCsv } from "@/lib/inventory/csv/rocpay"
import { FFLSAFE_HEADERS, ROCPAY_HEADERS } from "@/lib/inventory/csv/types"
import type { InventoryItem, InventoryUnit } from "@/lib/types/inventory"

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
    isSerialized: overrides.isSerialized,
    isOneOff: overrides.isOneOff,
    sourceType: overrides.sourceType,
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
    })
    expect(preview.rows[0]?.unit?.serialNumber).toBe("ABC123")
  })
})

// ─── Unit-aware RocPay tests ──────────────────────────────────────────────────

function makeUnit(overrides: Partial<InventoryUnit> = {}): InventoryUnit {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    inventoryItemId: overrides.inventoryItemId ?? "item-1",
    serialNumber: overrides.serialNumber ?? "SN-001",
    status: overrides.status ?? "AVAILABLE",
    sourceType: overrides.sourceType ?? "MANUAL",
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  }
}

describe("RocPay CSV — unit-aware export", () => {
  it("emits one row per AVAILABLE unit for a serialized item", () => {
    const item = buildInventoryItem({
      id: "item-1",
      name: "Glock 19",
      sku: "GLK-19",
      isSerialized: true,
      quantity: 3,
      cost: 400,
    })
    const units = [
      makeUnit({ inventoryItemId: "item-1", serialNumber: "SN-A", cost: 410 }),
      makeUnit({ inventoryItemId: "item-1", serialNumber: "SN-B", cost: 420 }),
      makeUnit({ inventoryItemId: "item-1", serialNumber: "SN-C", status: "SOLD", cost: 430 }),
    ]
    const unitsByItemId = new Map([["item-1", units]])

    const csv = exportInventoryToRocPayCsv([item], unitsByItemId)
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })

    // Two AVAILABLE units → two rows; SOLD unit excluded
    expect(parsed.data).toHaveLength(2)
    expect(parsed.data[0].QUANTITY).toBe("1")
    expect(parsed.data[1].QUANTITY).toBe("1")
    expect(parsed.data[0].UNITCOST).toBe("410.00")
    expect(parsed.data[1].UNITCOST).toBe("420.00")
  })

  it("falls back to a single aggregated row when unitsByItemId is not provided", () => {
    const item = buildInventoryItem({
      name: "Glock 19",
      sku: "GLK-19",
      isSerialized: true,
      quantity: 5,
      cost: 400,
    })

    const csv = exportInventoryToRocPayCsv([item])
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })

    expect(parsed.data).toHaveLength(1)
    expect(parsed.data[0].QUANTITY).toBe("5")
  })

  it("falls back to a single row when serialized item has no AVAILABLE units", () => {
    const item = buildInventoryItem({
      id: "item-sold",
      isSerialized: true,
      quantity: 0,
    })
    const unitsByItemId = new Map([
      ["item-sold", [makeUnit({ inventoryItemId: "item-sold", status: "SOLD" })]],
    ])

    const csv = exportInventoryToRocPayCsv([item], unitsByItemId)
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })

    expect(parsed.data).toHaveLength(1)
    expect(parsed.data[0].QUANTITY).toBe("0")
  })

  it("emits a normal aggregated row for non-serialized items regardless of unitsByItemId", () => {
    const item = buildInventoryItem({ quantity: 10, cost: 50 })
    const unitsByItemId = new Map<string, InventoryUnit[]>()

    const csv = exportInventoryToRocPayCsv([item], unitsByItemId)
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })

    expect(parsed.data).toHaveLength(1)
    expect(parsed.data[0].QUANTITY).toBe("10")
  })
})

describe("RocPay CSV — serialized-SKU import warning", () => {
  it("warns when an imported row matches a serialized existing SKU", () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'GLK-19,Glock 19,Firearm,1,425.00,Yes,Yes,NO,-,Active,"Glock 19",,',
    ].join("\n")

    const existing = [
      buildInventoryItem({
        id: "existing-serialized",
        sku: "GLK-19",
        isSerialized: true,
      }),
    ]

    const preview = parseRocPayInventoryCsv(csv, existing)

    expect(preview.rows[0].matchedInventoryItemId).toBe("existing-serialized")
    expect(preview.rows[0].warnings).toContain(
      "Serialized SKU; create units manually from /admin/inventory/existing-serialized.",
    )
  })

  it("does not warn when matched SKU is not serialized", () => {
    const csv = [
      ROCPAY_HEADERS.join(","),
      'SKU-1,Ammo,Ammunition,50,12.00,Yes,Yes,NO,-,Active,9mm FMJ,,',
    ].join("\n")

    const existing = [
      buildInventoryItem({ id: "ammo-1", sku: "SKU-1", isSerialized: false }),
    ]

    const preview = parseRocPayInventoryCsv(csv, existing)

    const hasSerializedWarning = preview.rows[0].warnings.some((w) =>
      w.includes("Serialized SKU"),
    )
    expect(hasSerializedWarning).toBe(false)
  })
})

// ─── Unit-aware FFLSafe tests ─────────────────────────────────────────────────

describe("FFLSafe CSV — unit-aware export", () => {
  it("emits one row per unit when unitsByItemId is provided", () => {
    const item = buildInventoryItem({
      id: "item-1",
      itemType: "FIREARM",
      name: "Glock 19",
      manufacturer: "Glock",
      model: "19",
      firearm: { requiresFflTransfer: true, caliber: "9mm", firearmType: "HANDGUN" },
    })
    const units = [
      makeUnit({ inventoryItemId: "item-1", serialNumber: "SN-A", acquisitionDate: "2026-01-01" }),
      makeUnit({ inventoryItemId: "item-1", serialNumber: "SN-B", acquisitionDate: "2026-02-01" }),
    ]
    const unitsByItemId = new Map([["item-1", units]])

    const csv = exportInventoryToFflSafeCsv([item], unitsByItemId)
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })

    expect(parsed.data).toHaveLength(2)
    expect(parsed.data[0]["Serial No."]).toBe("SN-A")
    expect(parsed.data[1]["Serial No."]).toBe("SN-B")
  })

  it("falls back to flat serialNumber when no units provided", () => {
    const item = buildInventoryItem({
      itemType: "FIREARM",
      manufacturer: "Glock",
      model: "19",
      firearm: { serialNumber: "LEGACY-SN", requiresFflTransfer: true, firearmType: "HANDGUN" },
    })

    const csv = exportInventoryToFflSafeCsv([item])
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })

    expect(parsed.data).toHaveLength(1)
    expect(parsed.data[0]["Serial No."]).toBe("LEGACY-SN")
  })

  it("marks SOLD units with a Dispose Date in export", () => {
    const item = buildInventoryItem({
      id: "item-1",
      itemType: "FIREARM",
      manufacturer: "Glock",
      model: "19",
      firearm: { requiresFflTransfer: true },
    })
    const soldUnit = makeUnit({
      inventoryItemId: "item-1",
      serialNumber: "SOLD-SN",
      status: "SOLD",
      updatedAt: "2026-03-15T00:00:00.000Z",
    })
    const unitsByItemId = new Map([["item-1", [soldUnit]]])

    const csv = exportInventoryToFflSafeCsv([item], unitsByItemId)
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })

    expect(parsed.data[0]["Dispose Date"]).toBeTruthy()
  })
})

describe("FFLSafe CSV — dedup on re-import", () => {
  it("warns when a serial already exists in inventory", () => {
    const csv = Papa.unparse({
      fields: [...FFLSAFE_HEADERS],
      data: [["Glock", "", "19", "ABC123", "Handgun", "9mm", "2026-05-01", "", "", "", "", "Inbound"]],
    })

    const existingUnits = [{ id: "unit-existing", serialNumber: "ABC123" }]
    const preview = parseFflSafeCsv(csv, [], undefined, existingUnits)

    expect(preview.rows[0].matchedInventoryUnitId).toBe("unit-existing")
    expect(preview.rows[0].duplicateSerialInInventory).toBe("ABC123")
    expect(preview.rows[0].warnings).toContain(
      'Serial "ABC123" already exists as a unit in inventory.',
    )
  })

  it("warns for duplicate serials within the same CSV file", () => {
    const csv = Papa.unparse({
      fields: [...FFLSAFE_HEADERS],
      data: [
        ["Glock", "", "19", "DUP-SN", "Handgun", "9mm", "2026-05-01", "", "", "", "", "Inbound"],
        ["Glock", "", "19", "DUP-SN", "Handgun", "9mm", "2026-05-01", "", "", "", "", "Inbound"],
      ],
    })

    const preview = parseFflSafeCsv(csv)

    expect(preview.rows[1].warnings).toContain(
      'Duplicate serial number "DUP-SN" appears multiple times in this CSV.',
    )
  })

  it("does not warn for unique serials not in existing inventory", () => {
    const csv = Papa.unparse({
      fields: [...FFLSAFE_HEADERS],
      data: [["Glock", "", "19", "BRAND-NEW", "Handgun", "9mm", "2026-05-01", "", "", "", "", "Inbound"]],
    })

    const preview = parseFflSafeCsv(csv, [], undefined, [])

    expect(preview.rows[0].matchedInventoryUnitId).toBeUndefined()
    const hasDupWarning = preview.rows[0].warnings.some((w) =>
      w.includes("already exists") || w.includes("Duplicate serial"),
    )
    expect(hasDupWarning).toBe(false)
  })

  it("produces a unit partial with the correct serial and status on each row", () => {
    // Use Papa.unparse so headers containing commas are properly quoted.
    const csv = Papa.unparse({
      fields: [...FFLSAFE_HEADERS],
      data: [
        ["Glock", "", "19", "ACTIVE-SN", "Handgun", "9mm", "2026-01-01", "", "", "", "", "Inbound"],
        ["Sig", "", "P320", "SOLD-SN", "Handgun", "9mm", "2025-06-01", "", "2026-03-01", "", "", ""],
      ],
    })

    const preview = parseFflSafeCsv(csv)

    expect(preview.rows[0].unit?.serialNumber).toBe("ACTIVE-SN")
    expect(preview.rows[0].unit?.status).toBe("AVAILABLE")
    expect(preview.rows[1].unit?.serialNumber).toBe("SOLD-SN")
    expect(preview.rows[1].unit?.status).toBe("SOLD")
  })
})
