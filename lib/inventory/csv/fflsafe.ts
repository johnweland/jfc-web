import Papa from "papaparse"

import type { InventoryItem } from "@/lib/types/inventory"
import type { InventoryImportPreview, ParsedInventoryRow } from "@/lib/inventory/csv/types"
import { FFLSAFE_HEADERS } from "@/lib/inventory/csv/types"
import {
  annotateDuplicateSkus,
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

  return {
    rowNumber,
    raw: rawRow,
    warnings,
    errors: [],
    item: {
      id: crypto.randomUUID(),
      itemType: "FIREARM",
      status: disposeDate ? "SOLD" : "AVAILABLE",
      name,
      category: type || undefined,
      description: notes || undefined,
      manufacturer: manufacturer || undefined,
      brand: manufacturer || undefined,
      model: model || undefined,
      price: 0,
      quantity: 1,
      taxMode: "DEFAULT",
      sourceSystem: "FFLSAFE",
      sourceId: serialNumber || undefined,
      importBatchId,
      firearm: {
        serialNumber: serialNumber || undefined,
        caliber: caliberOrGauge || undefined,
        gauge: undefined,
        firearmType: normalizedType,
        action: type || undefined,
        requiresFflTransfer: true,
      },
      images: [],
      createdAt,
      updatedAt: nowIso,
    },
  }
}

export function parseFflSafeCsv(
  csvText: string,
  existingItems: InventoryItem[] = [],
  importBatchId = `fflsafe-${Date.now()}`,
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

export function exportInventoryToFflSafeCsv(items: InventoryItem[]) {
  const firearmItems = items.filter((item) => item.itemType === "FIREARM")

  const rows = firearmItems.map((item) => ({
    'Manufacturer or "privately made firearm" (PMF)': item.manufacturer || item.brand || "",
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
  }))

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
