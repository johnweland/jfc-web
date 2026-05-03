import type { InventoryItem } from "@/lib/types/inventory"

export type InventoryImportSource = "ROCPAY" | "FFLSAFE"
export type InventoryExportDestination = "ROCPAY" | "FFLSAFE"
export type DuplicateInventoryBehavior =
  | "skip-existing"
  | "update-existing"
  | "create-duplicate"

export type CsvValidationSeverity = "warning" | "error"

export type CsvValidationIssue = {
  severity: CsvValidationSeverity
  message: string
}

export type CsvValidationSummary = {
  totalRows: number
  validRows: number
  warningRows: number
  errorRows: number
}

export type ParsedInventoryRow = {
  rowNumber: number
  raw: Record<string, string>
  item?: InventoryItem
  warnings: string[]
  errors: string[]
  duplicateSkuInFile?: string
  duplicateSkuInInventory?: string
  matchedInventoryItemId?: string
}

export type InventoryImportPreview = {
  format: InventoryImportSource
  headers: string[]
  missingHeaders: string[]
  rows: ParsedInventoryRow[]
  summary: CsvValidationSummary
}

export const ROCPAY_HEADERS = [
  "SKU",
  "DESCRIPTION",
  "CATEGORY",
  "QUANTITY",
  "UNITCOST",
  "TAXABLE",
  "INVENTORY",
  "IS_PINNED",
  "PINNED ORDER",
  "STATUS",
  "ITEMNAME",
  "UNIT OF MEASURE",
  "COMMODITY CODE",
] as const

export const FFLSAFE_HEADERS = [
  'Manufacturer or "privately made firearm" (PMF)',
  "Importer (if any)",
  "Model",
  "Serial No.",
  "Type",
  "Caliber or gauge",
  "Acquire Date",
  "Name and address of nonlicensee; or if licensee, name and license No.",
  "Dispose Date",
  "Dispose Name",
  "Address of nonlicensee; license No. of licensee; or Form 4473 transaction No. if such forms filed numerically",
  "Notes",
] as const

export type RocPayHeader = (typeof ROCPAY_HEADERS)[number]
export type FflSafeHeader = (typeof FFLSAFE_HEADERS)[number]
