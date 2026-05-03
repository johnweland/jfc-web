import type { InventoryItem, InventoryItemType, InventoryStatus } from "@/lib/types/inventory"
import type {
  CsvValidationSummary,
  ParsedInventoryRow,
} from "@/lib/inventory/csv/types"

type ParsedIntegerFieldResult =
  | { value: number; warning?: string; error?: undefined }
  | { error: string; value?: undefined; warning?: undefined }

type ParsedCurrencyFieldResult =
  | { value: number | undefined; warning?: string; error?: undefined }
  | { error: string; value?: undefined; warning?: undefined }

const APPAREL_CATEGORY_TERMS = [
  "apparel",
  "clothes",
  "clothing",
  "merch",
  "headwear",
  "shirt",
  "tee",
  "hoodie",
  "hat",
  "cap",
  "beanie",
  "jacket",
  "pants",
  "shorts",
  "sock",
  "glove",
] as const

export function normalizeHeader(header: string) {
  return header.trim()
}

export function normalizeCellValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function findMissingHeaders(
  headers: readonly string[],
  requiredHeaders: readonly string[],
) {
  const headerSet = new Set(headers.map(normalizeHeader))
  return requiredHeaders.filter((header) => !headerSet.has(normalizeHeader(header)))
}

export function isEmptyCsvRow(row: Record<string, unknown>) {
  return Object.values(row).every((value) => normalizeCellValue(value) === "")
}

export function summarizeImportRows(rows: ParsedInventoryRow[]): CsvValidationSummary {
  const warningRows = rows.filter((row) => row.warnings.length > 0).length
  const errorRows = rows.filter((row) => row.errors.length > 0).length
  const validRows = rows.filter((row) => row.errors.length === 0).length

  return {
    totalRows: rows.length,
    validRows,
    warningRows,
    errorRows,
  }
}

export function parseIntegerField(value: string): ParsedIntegerFieldResult {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return { value: 0, warning: "Quantity was blank and defaulted to 0." }
  }

  if (normalized === "n/a" || normalized === "na") {
    return { value: 0, warning: `Quantity "${value}" defaulted to 0.` }
  }

  if (!/^-?\d+$/.test(value.trim())) {
    return { error: `Quantity "${value}" is not a valid whole number.` }
  }

  return { value: Number.parseInt(value, 10) }
}

export function parseCurrencyField(value: string, label: string): ParsedCurrencyFieldResult {
  const normalizedInput = value.trim()
  const lowered = normalizedInput.toLowerCase()

  if (!normalizedInput) {
    return { value: undefined }
  }

  if (lowered === "n/a" || lowered === "na") {
    return { value: 0, warning: `${label} "${value}" defaulted to 0.` }
  }

  const normalized = value.replace(/[$,]/g, "").trim()
  const parsed = Number.parseFloat(normalized)

  if (!Number.isFinite(parsed)) {
    return { error: `${label} "${value}" is not a valid number.` }
  }

  return { value: parsed }
}

export function inferItemTypeFromCategory(category: string): {
  itemType: InventoryItemType
  warning?: string
} {
  const normalized = category.trim().toLowerCase()

  if (normalized.includes("firearm")) {
    return { itemType: "FIREARM" }
  }

  if (
    normalized.includes("service") ||
    normalized.includes("transfer") ||
    normalized.includes("repair") ||
    normalized.includes("labor")
  ) {
    return { itemType: "SERVICES" }
  }

  if (
    normalized.includes("ammunition") ||
    normalized.includes("ammo")
  ) {
    return { itemType: "AMMUNITION" }
  }

  if (normalized === "apparel" || normalized === "clothes") {
    return { itemType: "APPAREL" }
  }

  if (APPAREL_CATEGORY_TERMS.some((term) => normalized.includes(term))) {
    return { itemType: "APPAREL" }
  }

  if (!normalized) {
    return {
      itemType: "OTHER",
      warning: "Missing category was mapped to OTHER.",
    }
  }

  if (normalized === "other" || normalized.includes("misc") || normalized.includes("unknown")) {
    return { itemType: "OTHER" }
  }

  if (
    normalized.includes("part") ||
    normalized.includes("optic") ||
    normalized.includes("magazine") ||
    normalized.includes("handguard")
  ) {
    return { itemType: "PART" }
  }

  return {
    itemType: "OTHER",
    warning: `Unknown category "${category}" was mapped to OTHER.`,
  }
}

export function mapAvailabilityStatus(value: string): {
  status: InventoryStatus
  warning?: string
} {
  const normalized = value.trim().toLowerCase()

  if (!normalized || normalized === "active" || normalized === "available") {
    return { status: "AVAILABLE" }
  }

  if (normalized === "draft") {
    return { status: "DRAFT" }
  }

  if (normalized === "reserved") {
    return { status: "RESERVED" }
  }

  if (normalized === "sold" || normalized === "disposed") {
    return { status: "SOLD" }
  }

  return {
    status: "ARCHIVED",
    warning: `Unknown status "${value}" was mapped to ARCHIVED.`,
  }
}

export function formatDateOnly(value: string) {
  if (!value.trim()) {
    return ""
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  return parsed.toISOString().slice(0, 10)
}

export function buildNotes(item: InventoryItem) {
  return [
    item.sku ? `SKU: ${item.sku}` : null,
    item.name ? `Name: ${item.name}` : null,
    item.category ? `Category: ${item.category}` : null,
    item.location ? `Location: ${item.location}` : null,
  ]
    .filter(Boolean)
    .join(" | ")
}

export function annotateDuplicateSkus(
  rows: ParsedInventoryRow[],
  existingItems: InventoryItem[],
) {
  const seenSkus = new Map<string, number>()
  const inventoryBySku = new Map<string, InventoryItem>()
  const inventoryBySourceKey = new Map<string, InventoryItem>()

  for (const item of existingItems) {
    const sku = item.sku?.trim()
    if (sku && !inventoryBySku.has(sku)) {
      inventoryBySku.set(sku, item)
    }

    const sourceKey =
      item.sourceSystem && item.sourceId
        ? `${item.sourceSystem}:${item.sourceId.trim()}`
        : null
    if (sourceKey && !inventoryBySourceKey.has(sourceKey)) {
      inventoryBySourceKey.set(sourceKey, item)
    }
  }

  for (const row of rows) {
    const sku = row.item?.sku?.trim()
    if (!sku) {
      continue
    }

    const seenCount = seenSkus.get(sku) ?? 0
    seenSkus.set(sku, seenCount + 1)
    if (seenCount > 0) {
      row.duplicateSkuInFile = sku
      row.warnings.push(`Duplicate SKU "${sku}" appears multiple times in this CSV.`)
    }

    const sourceKey =
      row.item?.sourceSystem && row.item?.sourceId
        ? `${row.item.sourceSystem}:${row.item.sourceId.trim()}`
        : null
    const existing =
      (sourceKey ? inventoryBySourceKey.get(sourceKey) : undefined) ??
      inventoryBySku.get(sku)
    if (existing) {
      row.duplicateSkuInInventory = sku
      row.matchedInventoryItemId = existing.id
      row.warnings.push(`SKU "${sku}" already exists in inventory.`)
    }
  }

  return rows
}
