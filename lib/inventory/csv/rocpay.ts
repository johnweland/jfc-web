import Papa from "papaparse"

import type { InventoryItem, InventoryTaxMode, InventoryUnit } from "@/lib/types/inventory"
import type {
  InventoryImportPreview,
  ParsedInventoryRow,
} from "@/lib/inventory/csv/types"
import { ROCPAY_HEADERS } from "@/lib/inventory/csv/types"
import {
  annotateDuplicateSkus,
  findMissingHeaders,
  inferItemTypeFromCategory,
  isEmptyCsvRow,
  mapAvailabilityStatus,
  normalizeCellValue,
  normalizeHeader,
  parseCurrencyField,
  parseIntegerField,
  summarizeImportRows,
} from "@/lib/inventory/csv/validation"
import { normalizeInventoryCategory } from "@/lib/inventory/category"

function mapTaxMode(value: string): {
  taxMode: InventoryTaxMode
  warning?: string
} {
  const normalized = value.trim().toLowerCase()

  if (normalized === "yes") {
    return { taxMode: "DEFAULT" }
  }

  if (normalized === "no") {
    return { taxMode: "EXEMPT" }
  }

  return {
    taxMode: "DEFAULT",
    warning: `Taxable value "${value}" was mapped to DEFAULT.`,
  }
}

function buildRocPayRow(
  rawRow: Record<string, string>,
  rowNumber: number,
  importBatchId: string,
  nowIso: string,
): ParsedInventoryRow {
  const warnings: string[] = []
  const errors: string[] = []

  const sku = normalizeCellValue(rawRow.SKU)
  const name =
    normalizeCellValue(rawRow.ITEMNAME) ||
    normalizeCellValue(rawRow.DESCRIPTION) ||
    sku ||
    `RocPay item ${rowNumber}`
  const description = normalizeCellValue(rawRow.DESCRIPTION) || undefined
  const category = normalizeCellValue(rawRow.CATEGORY)

  const quantityResult = parseIntegerField(normalizeCellValue(rawRow.QUANTITY))
  if (quantityResult.error) {
    errors.push(quantityResult.error)
  } else if (quantityResult.warning) {
    warnings.push(quantityResult.warning)
  }

  const costResult = parseCurrencyField(normalizeCellValue(rawRow.UNITCOST), "UNITCOST")
  if (costResult.error) {
    errors.push(costResult.error)
  } else if (costResult.warning) {
    warnings.push(costResult.warning)
  }

  const { itemType, warning: itemTypeWarning } = inferItemTypeFromCategory(category)
  if (itemTypeWarning) {
    warnings.push(itemTypeWarning)
  }

  const { status, warning: statusWarning } = mapAvailabilityStatus(
    normalizeCellValue(rawRow.STATUS),
  )
  if (statusWarning) {
    warnings.push(statusWarning)
  }

  const { taxMode, warning: taxWarning } = mapTaxMode(normalizeCellValue(rawRow.TAXABLE))
  if (taxWarning) {
    warnings.push(taxWarning)
  }

  const cost = costResult.error ? undefined : costResult.value
  const quantity = quantityResult.error ? 0 : (quantityResult.value ?? 0)

  const item: InventoryItem = {
    id: crypto.randomUUID(),
    itemType,
    status,
    name,
    category: normalizeInventoryCategory(category, itemType),
    description,
    sku: sku || undefined,
    price: typeof cost === "number" ? cost : 0,
    cost,
    quantity,
    taxMode,
    sourceSystem: "ROCPAY",
    sourceId: sku || undefined,
    importBatchId,
    images: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  if (itemType === "FIREARM") {
    item.firearm = {
      requiresFflTransfer: true,
    }
    warnings.push("RocPay firearm row is missing a serial number.")
    warnings.push("RocPay firearm row is missing manufacturer, model, or caliber details.")
  }

  return {
    rowNumber,
    raw: rawRow,
    item,
    warnings,
    errors,
  }
}

export function parseRocPayInventoryCsv(
  csvText: string,
  existingItems: InventoryItem[] = [],
  importBatchId = `rocpay-${Date.now()}`,
): InventoryImportPreview {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  })

  const headers = (parsed.meta.fields ?? []).map(normalizeHeader)
  const missingHeaders = findMissingHeaders(headers, ROCPAY_HEADERS)
  const nowIso = new Date().toISOString()
  const rows: ParsedInventoryRow[] = []

  for (const [index, raw] of parsed.data.entries()) {
    if (isEmptyCsvRow(raw)) {
      continue
    }

    const normalizedRow = Object.fromEntries(
      ROCPAY_HEADERS.map((header) => [header, normalizeCellValue(raw[header])]),
    )

    rows.push(buildRocPayRow(normalizedRow, index + 2, importBatchId, nowIso))
  }

  annotateDuplicateSkus(rows, existingItems)

  // Warn when a RocPay row would touch a serialized SKU's quantity.
  // RocPay imports don't carry serial numbers; per-unit data must be entered manually.
  for (const row of rows) {
    if (!row.matchedInventoryItemId) continue
    const matched = existingItems.find((i) => i.id === row.matchedInventoryItemId)
    if (matched?.isSerialized) {
      row.warnings.push(
        `Serialized SKU; create units manually from /admin/inventory/${matched.id}.`,
      )
    }
  }

  if (missingHeaders.length > 0) {
    for (const row of rows) {
      row.errors.push(
        `Missing required RocPay headers: ${missingHeaders.join(", ")}.`,
      )
    }
  }

  return {
    format: "ROCPAY",
    headers,
    missingHeaders,
    rows,
    summary: summarizeImportRows(rows),
  }
}

function buildRocPayRowFromItem(item: InventoryItem, quantity: number, cost?: number) {
  return {
    SKU: item.sku || item.name,
    DESCRIPTION: item.description ?? "",
    CATEGORY: item.category ?? "",
    QUANTITY: String(quantity),
    UNITCOST:
      typeof cost === "number"
        ? cost.toFixed(2)
        : typeof item.cost === "number"
          ? item.cost.toFixed(2)
          : "",
    TAXABLE: item.taxMode === "EXEMPT" ? "No" : "Yes",
    INVENTORY: item.itemType === "SERVICES" ? "No" : "Yes",
    "IS_PINNED": "NO",
    "PINNED ORDER": "-",
    STATUS: item.status === "AVAILABLE" ? "Active" : "Inactive",
    ITEMNAME: item.name,
    "UNIT OF MEASURE": "",
    "COMMODITY CODE": "",
  }
}

/**
 * RocPay export.
 *
 * For serialized items, emit one row per AVAILABLE unit (RocPay treats each row as one
 * sellable line item with QUANTITY=1). For non-serialized items, emit a single
 * aggregated row using the item's `quantity`.
 *
 * `unitsByItemId` is optional; when omitted, serialized items fall back to a single
 * aggregated row (legacy behavior) so callers with no unit data still get a valid CSV.
 */
export function exportInventoryToRocPayCsv(
  items: InventoryItem[],
  unitsByItemId?: Map<string, InventoryUnit[]>,
) {
  const rows: ReturnType<typeof buildRocPayRowFromItem>[] = []

  for (const item of items) {
    if (item.isSerialized && unitsByItemId) {
      const available = (unitsByItemId.get(item.id) ?? []).filter(
        (u) => u.status === "AVAILABLE",
      )
      if (available.length > 0) {
        for (const unit of available) {
          rows.push(buildRocPayRowFromItem(item, 1, unit.cost))
        }
        continue
      }
    }
    rows.push(buildRocPayRowFromItem(item, item.quantity, item.cost))
  }

  return Papa.unparse(rows, {
    columns: [...ROCPAY_HEADERS],
  })
}
