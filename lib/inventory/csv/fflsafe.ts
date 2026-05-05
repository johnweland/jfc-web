import Papa from "papaparse"

import type { InventoryItem, InventoryUnit } from "@/lib/types/inventory"
import type { InventoryImportPreview, ParsedInventoryRow } from "@/lib/inventory/csv/types"
import { FFLSAFE_HEADERS } from "@/lib/inventory/csv/types"
import {
  annotateDuplicateSkus,
  annotateDuplicateUnits,
  buildNotes,
  findMissingHeaders,
  formatDateOnly,
  isEmptyCsvRow,
  normalizeCellValue,
  normalizeHeader,
  summarizeImportRows,
} from "@/lib/inventory/csv/validation"

function normalizeFirearmType(value: string) {
  const normalized = value.trim().toLowerCase()

  if (normalized.includes("handgun") || normalized.includes("pistol")) {
    return "HANDGUN"
  }

  if (normalized.includes("rifle")) {
    return "RIFLE"
  }

  if (normalized.includes("shotgun")) {
    return "SHOTGUN"
  }

  if (normalized.includes("receiver") || normalized.includes("frame")) {
    return "RECEIVER"
  }

  return normalized ? "OTHER" : undefined
}

function buildFflSafeImportRow(
  rawRow: Record<string, string>,
  rowNumber: number,
  importBatchId: string,
  nowIso: string,
): ParsedInventoryRow {
  const warnings: string[] = []
  const manufacturer = normalizeCellValue(
    rawRow['Manufacturer or "privately made firearm" (PMF)'],
  )
  const model = normalizeCellValue(rawRow.Model)
  const serialNumber = normalizeCellValue(rawRow["Serial No."])
  const type = normalizeCellValue(rawRow.Type)
  const caliberOrGauge = normalizeCellValue(rawRow["Caliber or gauge"])
  const acquireDate = normalizeCellValue(rawRow["Acquire Date"])
  const disposeDate = normalizeCellValue(rawRow["Dispose Date"])
  const notes = normalizeCellValue(rawRow.Notes)

  if (!manufacturer) {
    warnings.push("FFLSafe firearm row is missing a manufacturer.")
  }

  if (!model) {
    warnings.push("FFLSafe firearm row is missing a model.")
  }

  if (!serialNumber) {
    warnings.push("FFLSafe firearm row is missing a serial number.")
  }

  if (!type) {
    warnings.push("FFLSafe firearm row is missing a firearm type.")
  }

  if (!caliberOrGauge) {
    warnings.push("FFLSafe firearm row is missing caliber or gauge.")
  }

  const createdAt = formatDateOnly(acquireDate)
    ? new Date(`${formatDateOnly(acquireDate)}T00:00:00.000Z`).toISOString()
    : nowIso

  const name = [manufacturer, model, serialNumber].filter(Boolean).join(" ") || `FFLSafe firearm ${rowNumber}`
  const normalizedType = normalizeFirearmType(type)

  const itemId = crypto.randomUUID()
  const item: InventoryItem = {
    id: itemId,
    itemType: "FIREARM",
    // The InventoryItem represents the SKU; status reflects the SKU's lifecycle.
    // Per-unit status (SOLD/AVAILABLE) lives on the InventoryUnit.
    status: "AVAILABLE",
    name,
    category: type || undefined,
    description: notes || undefined,
    manufacturer: manufacturer || undefined,
    brand: manufacturer || undefined,
    model: model || undefined,
    price: 0,
    quantity: 0, // derived; sync'd by units/data.ts after units land
    taxMode: "DEFAULT",
    sourceSystem: "FFLSAFE",
    // SKU-level identifier — different from the per-unit serial.
    sourceId: undefined,
    importBatchId,
    isSerialized: true,
    sourceType: "IMPORTED",
    firearm: {
      serialNumber: undefined,
      caliber: caliberOrGauge || undefined,
      gauge: undefined,
      firearmType: normalizedType,
      action: type || undefined,
      requiresFflTransfer: true,
    },
    images: [],
    createdAt,
    updatedAt: nowIso,
  }

  const unit: Partial<InventoryUnit> = {
    inventoryItemId: itemId,
    serialNumber: serialNumber || "",
    status: disposeDate ? "SOLD" : "AVAILABLE",
    sourceType: "IMPORTED",
    sourceSystem: "FFLSAFE",
    sourceId: serialNumber || undefined,
    acquisitionDate: formatDateOnly(acquireDate) || undefined,
    importBatchId,
    notes: notes || undefined,
  }

  return {
    rowNumber,
    raw: rawRow,
    warnings,
    errors: [],
    item,
    unit,
  }
}

export function parseFflSafeCsv(
  csvText: string,
  existingItems: InventoryItem[] = [],
  importBatchId = `fflsafe-${Date.now()}`,
  existingUnits: { id: string; serialNumber: string }[] = [],
): InventoryImportPreview {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  })

  const headers = (parsed.meta.fields ?? []).map(normalizeHeader)
  const missingHeaders = findMissingHeaders(headers, FFLSAFE_HEADERS)
  const nowIso = new Date().toISOString()
  const rows: ParsedInventoryRow[] = []

  for (const [index, raw] of parsed.data.entries()) {
    if (isEmptyCsvRow(raw)) {
      continue
    }

    const normalizedRow = Object.fromEntries(
      FFLSAFE_HEADERS.map((header) => [header, normalizeCellValue(raw[header])]),
    )
    rows.push(buildFflSafeImportRow(normalizedRow, index + 2, importBatchId, nowIso))
  }

  annotateDuplicateSkus(rows, existingItems)
  annotateDuplicateUnits(rows, existingUnits)

  if (missingHeaders.length > 0) {
    for (const row of rows) {
      row.errors.push(
        `Missing required FFLSafe headers: ${missingHeaders.join(", ")}.`,
      )
    }
  }

  return {
    format: "FFLSAFE",
    headers,
    missingHeaders,
    rows,
    summary: summarizeImportRows(rows),
  }
}

/**
 * FFLSafe export — bound-book format, one row per physical firearm (serialized unit).
 *
 * When `unitsByItemId` is provided, emits one row per unit using the unit's serial
 * and acquisition data. When omitted, falls back to the legacy single-row-per-item
 * shape using the item's flat `firearm.serialNumber` (pre-migration compatibility).
 *
 * Non-firearm items are filtered out — FFLSafe only tracks firearms.
 */
export function exportInventoryToFflSafeCsv(
  items: InventoryItem[],
  unitsByItemId?: Map<string, InventoryUnit[]>,
) {
  const firearmItems = items.filter((item) => item.itemType === "FIREARM")
  const rows: Array<Record<(typeof FFLSAFE_HEADERS)[number], string>> = []

  for (const item of firearmItems) {
    const units = unitsByItemId?.get(item.id) ?? []

    if (units.length > 0) {
      for (const unit of units) {
        rows.push({
          'Manufacturer or "privately made firearm" (PMF)':
            item.manufacturer || item.brand || "",
          "Importer (if any)": "",
          Model: item.model ?? "",
          "Serial No.": unit.serialNumber,
          Type: item.firearm?.firearmType ?? item.firearm?.action ?? "",
          "Caliber or gauge": item.firearm?.caliber ?? item.firearm?.gauge ?? "",
          "Acquire Date": formatDateOnly(unit.acquisitionDate ?? unit.createdAt),
          "Name and address of nonlicensee; or if licensee, name and license No.":
            unit.acquisitionSourceName ?? "",
          "Dispose Date": unit.status === "SOLD" ? formatDateOnly(unit.updatedAt) : "",
          "Dispose Name": "",
          "Address of nonlicensee; license No. of licensee; or Form 4473 transaction No. if such forms filed numerically":
            "",
          Notes: buildNotes(item),
        })
      }
      continue
    }

    // Legacy fallback — pre-migration items with a single flat serial number.
    rows.push({
      'Manufacturer or "privately made firearm" (PMF)':
        item.manufacturer || item.brand || "",
      "Importer (if any)": "",
      Model: item.model ?? "",
      "Serial No.": item.firearm?.serialNumber ?? "",
      Type: item.firearm?.firearmType ?? item.firearm?.action ?? "",
      "Caliber or gauge": item.firearm?.caliber ?? item.firearm?.gauge ?? "",
      "Acquire Date": formatDateOnly(item.createdAt),
      "Name and address of nonlicensee; or if licensee, name and license No.": "",
      "Dispose Date": "",
      "Dispose Name": "",
      "Address of nonlicensee; license No. of licensee; or Form 4473 transaction No. if such forms filed numerically":
        "",
      Notes: buildNotes(item),
    })
  }

  return Papa.unparse(rows, {
    columns: [...FFLSAFE_HEADERS],
  })
}

export function getFflSafeExportWarnings(items: InventoryItem[]) {
  return items
    .filter((item) => item.itemType === "FIREARM")
    .flatMap((item) => {
      const warnings: string[] = []

      if (!item.firearm?.serialNumber) {
        warnings.push(`${item.name}: missing serial number for FFLSafe export.`)
      }

      if (!(item.manufacturer || item.brand)) {
        warnings.push(`${item.name}: missing manufacturer for FFLSafe export.`)
      }

      if (!item.model) {
        warnings.push(`${item.name}: missing model for FFLSafe export.`)
      }

      if (!(item.firearm?.firearmType || item.firearm?.action)) {
        warnings.push(`${item.name}: missing firearm type for FFLSafe export.`)
      }

      if (!(item.firearm?.caliber || item.firearm?.gauge)) {
        warnings.push(`${item.name}: missing caliber or gauge for FFLSafe export.`)
      }

      return warnings
    })
}
