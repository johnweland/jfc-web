"use client"

import { useMemo, useState, useSyncExternalStore, useTransition, type ChangeEvent } from "react"
import { generateClient } from "aws-amplify/data"
import { Download, FileUp, LoaderCircle, Trash2, TriangleAlert } from "lucide-react"
import { useRouter } from "next/navigation"

import type { Schema } from "@/amplify/data/resource"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { parseFflSafeCsv, exportInventoryToFflSafeCsv, getFflSafeExportWarnings } from "@/lib/inventory/csv/fflsafe"
import { exportInventoryToRocPayCsv, parseRocPayInventoryCsv } from "@/lib/inventory/csv/rocpay"
import type {
  DuplicateInventoryBehavior,
  InventoryExportDestination,
  InventoryImportPreview,
  InventoryImportSource,
  ParsedInventoryRow,
} from "@/lib/inventory/csv/types"
import { toAmplifyCreateInput, toAmplifyUpdateInput } from "@/lib/inventory/mapper"
import type { InventoryItem } from "@/lib/types/inventory"

const client = generateClient<Schema>()
const INVENTORY_LIST_LIMIT = 1000

type ImportRunResult = {
  created: number
  updated: number
  skipped: Array<{ rowNumber: number; reason: string }>
  failed: Array<{ rowNumber: number; reason: string }>
}

function buildImportPreview(
  csvText: string,
  source: InventoryImportSource,
  existingItems: InventoryItem[],
) {
  const importBatchId = `${source.toLowerCase()}-${Date.now()}`

  if (source === "FFLSAFE") {
    return parseFflSafeCsv(csvText, existingItems, importBatchId)
  }

  return parseRocPayInventoryCsv(csvText, existingItems, importBatchId)
}

async function listAllInventoryItemsClientSide(isE2eTestMode: boolean) {
  if (isE2eTestMode) {
    const response = await fetch("/api/e2e/inventory", {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Unable to load e2e inventory items.")
    }

    const payload = (await response.json()) as { items: InventoryItem[] }
    return payload.items.map((item) => ({
      id: item.id,
      name: item.name,
    }))
  }

  const records: Array<{ id: string; name?: string | null }> = []
  let nextToken: string | null | undefined = undefined

  do {
    const response: {
      data?: Array<{ id: string; title?: string | null }>
      errors?: readonly { message: string }[]
      nextToken?: string | null
    } = await client.models.InventoryItem.list({
      limit: INVENTORY_LIST_LIMIT,
      nextToken,
      selectionSet: ["id", "title"] as const,
    })

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(" "))
    }

    records.push(
      ...((response.data ?? []) as Array<{ id: string; title?: string | null }>).map((item) => ({
        id: item.id,
        name: item.title ?? undefined,
      })),
    )

    nextToken = response.nextToken
  } while (nextToken)

  return records
}

function findExistingInventoryItem(item: InventoryItem, inventory: InventoryItem[]) {
  if (item.sourceSystem && item.sourceId) {
    const exactSourceMatch = inventory.find(
      (candidate) =>
        candidate.sourceSystem === item.sourceSystem &&
        candidate.sourceId === item.sourceId,
    )
    if (exactSourceMatch) {
      return exactSourceMatch
    }
  }

  if (item.sku) {
    return inventory.find((candidate) => candidate.sku === item.sku)
  }

  return undefined
}

function mergeImportedInventoryItem(existing: InventoryItem, imported: InventoryItem): InventoryItem {
  const nextFirearm =
    existing.itemType === "FIREARM" || imported.itemType === "FIREARM"
      ? {
          ...existing.firearm,
          ...Object.fromEntries(
            Object.entries(imported.firearm ?? {}).filter(([, value]) => value !== undefined),
          ),
          requiresFflTransfer:
            imported.firearm?.requiresFflTransfer ??
            existing.firearm?.requiresFflTransfer ??
            false,
        }
      : undefined

  const nextApparel =
    existing.itemType === "APPAREL" || imported.itemType === "APPAREL"
      ? {
          ...existing.apparel,
          ...Object.fromEntries(
            Object.entries(imported.apparel ?? {}).filter(([, value]) => value !== undefined),
          ),
        }
      : undefined

  return {
    ...existing,
    itemType: imported.itemType,
    status: imported.status,
    name: imported.name || existing.name,
    category: imported.category ?? existing.category,
    description: imported.description ?? existing.description,
    manufacturer: imported.manufacturer ?? existing.manufacturer,
    brand: imported.brand ?? existing.brand,
    model: imported.model ?? existing.model,
    sku: imported.sku ?? existing.sku,
    upc: imported.upc ?? existing.upc,
    price:
      typeof imported.cost === "number" || imported.price > 0
        ? imported.price
        : existing.price,
    cost: imported.cost ?? existing.cost,
    quantity: imported.quantity,
    location: imported.location ?? existing.location,
    taxMode: imported.taxMode,
    customTaxRate: imported.customTaxRate ?? existing.customTaxRate,
    sourceSystem: imported.sourceSystem,
    sourceId: imported.sourceId ?? existing.sourceId,
    importBatchId: imported.importBatchId ?? existing.importBatchId,
    firearm: nextFirearm,
    apparel: nextApparel,
    images: imported.images?.length ? imported.images : existing.images,
    createdAt: existing.createdAt,
    updatedAt: imported.updatedAt,
  }
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const href = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  link.click()
  URL.revokeObjectURL(href)
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function PreviewTable({ rows }: { rows: ParsedInventoryRow[] }) {
  return (
    <div className="max-h-[58vh] overflow-auto rounded-xl border border-border/60 bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ROW</TableHead>
            <TableHead>NAME</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>TYPE</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead>ISSUES</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.rowNumber}-${row.item?.id ?? "empty"}`}>
              <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
              <TableCell className="min-w-48">{row.item?.name ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{row.item?.sku ?? "—"}</TableCell>
              <TableCell className="text-xs uppercase">{row.item?.itemType ?? "—"}</TableCell>
              <TableCell className="text-xs uppercase">{row.item?.status ?? "—"}</TableCell>
              <TableCell className="min-w-72 align-top">
                <div className="flex flex-col gap-1 py-1">
                  {row.errors.map((message) => (
                    <p key={`error-${message}`} className="text-xs text-destructive">
                      {message}
                    </p>
                  ))}
                  {row.warnings.map((message) => (
                    <p key={`warning-${message}`} className="text-xs text-muted-foreground">
                      {message}
                    </p>
                  ))}
                  {row.errors.length === 0 && row.warnings.length === 0 ? (
                    <p className="text-xs text-emerald-700">Ready to import</p>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function InventoryCsvActions({
  items,
  onInventoryChanged,
  isE2eTestMode = false,
}: {
  items: InventoryItem[]
  onInventoryChanged?: () => Promise<void> | void
  isE2eTestMode?: boolean
}) {
  const router = useRouter()
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [importSource, setImportSource] = useState<InventoryImportSource>("ROCPAY")
  const [duplicateBehavior, setDuplicateBehavior] =
    useState<DuplicateInventoryBehavior>("skip-existing")
  const [csvText, setCsvText] = useState("")
  const [fileName, setFileName] = useState("")
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportRunResult | null>(null)
  const [exportDestination, setExportDestination] =
    useState<InventoryExportDestination>("ROCPAY")
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const hasMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  const preview: InventoryImportPreview | null = useMemo(() => {
    if (!csvText) {
      return null
    }

    return buildImportPreview(csvText, importSource, items)
  }, [csvText, importSource, items])

  const exportWarnings = useMemo(() => {
    if (exportDestination !== "FFLSAFE") {
      return []
    }

    return getFflSafeExportWarnings(items)
  }, [exportDestination, items])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const text = await file.text()
    setFileName(file.name)
    setCsvText(text)
    setImportMessage(null)
    setImportResult(null)
  }

  function resetImportState() {
    setFileName("")
    setCsvText("")
    setImportMessage(null)
    setImportResult(null)
  }

  function handleDownload() {
    const stamp = new Date().toISOString().slice(0, 10)
    if (exportDestination === "FFLSAFE") {
      downloadCsv(`inventory-fflsafe-${stamp}.csv`, exportInventoryToFflSafeCsv(items))
      return
    }

    downloadCsv(`inventory-rocpay-${stamp}.csv`, exportInventoryToRocPayCsv(items))
  }

  function handleImportConfirm() {
    if (!preview) {
      return
    }

    startTransition(async () => {
      const workingInventory = [...items]
      const result: ImportRunResult = {
        created: 0,
        updated: 0,
        skipped: [],
        failed: [],
      }

      for (const row of preview.rows) {
        if (!row.item) {
          continue
        }

        if (row.errors.length > 0) {
          result.skipped.push({
            rowNumber: row.rowNumber,
            reason: row.errors.join(" "),
          })
          continue
        }

        const existing = findExistingInventoryItem(row.item, workingInventory)

        if (existing && duplicateBehavior === "skip-existing") {
          result.skipped.push({
            rowNumber: row.rowNumber,
            reason: `Skipped existing SKU ${row.item.sku ?? row.item.name}.`,
          })
          continue
        }

        const payload =
          existing && duplicateBehavior === "update-existing"
            ? mergeImportedInventoryItem(existing, row.item)
            : row.item

        if (isE2eTestMode) {
          continue
        }

        const operation = existing && duplicateBehavior === "update-existing"
          ? client.models.InventoryItem.update(toAmplifyUpdateInput(payload))
          : client.models.InventoryItem.create(toAmplifyCreateInput(payload))

        const response = await operation
        if (response.errors?.length) {
          result.failed.push({
            rowNumber: row.rowNumber,
            reason: response.errors.map((error) => error.message).join(" "),
          })
          continue
        }

        if (existing && duplicateBehavior === "update-existing") {
          result.updated += 1
          const index = workingInventory.findIndex((item) => item.id === existing.id)
          if (index >= 0) {
            workingInventory[index] = payload
          }
        } else {
          result.created += 1
          workingInventory.push(payload)
        }
      }

      if (isE2eTestMode) {
        const validItems = preview.rows
          .filter((row) => row.item && row.errors.length === 0)
          .map((row) => row.item as InventoryItem)
        const response = await fetch("/api/e2e/inventory", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            action: "import",
            items: validItems,
            duplicateBehavior,
          }),
        })

        if (!response.ok) {
          throw new Error("Unable to import e2e inventory items.")
        }

        const importResultPayload = (await response.json()) as ImportRunResult
        result.created = importResultPayload.created
        result.updated = importResultPayload.updated
        result.skipped = importResultPayload.skipped
        result.failed = importResultPayload.failed
      }

      setImportResult(result)
      setImportMessage(
        `Import finished: ${result.created} created, ${result.updated} updated, ${result.skipped.length} skipped, ${result.failed.length} failed.`,
      )

      if (onInventoryChanged) {
        await onInventoryChanged()
      } else {
        router.refresh()
      }
    })
  }

  function handleDeleteAll() {
    startTransition(async () => {
      try {
        const allItems = await listAllInventoryItemsClientSide(isE2eTestMode)

        if (allItems.length === 0) {
          setDeleteMessage("There are no inventory items to delete.")
          return
        }

        const confirmed = window.confirm(
          `Delete all ${allItems.length} inventory items? This is intended for test resets and cannot be undone.`,
        )

        if (!confirmed) {
          return
        }

        const failures: string[] = []

        for (const item of allItems) {
          if (isE2eTestMode) {
            continue
          }

          const response = await client.models.InventoryItem.delete({ id: item.id })
          if (response.errors?.length) {
            failures.push(`${item.name ?? item.id}: ${response.errors.map((error) => error.message).join(" ")}`)
          }
        }

        if (isE2eTestMode) {
          await fetch("/api/e2e/inventory", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ action: "reset" }),
          })
        }

        if (failures.length > 0) {
          setDeleteMessage(
            `Deleted ${allItems.length - failures.length} items, but ${failures.length} failed. ${failures[0]}`,
          )
        } else {
          setDeleteMessage(`Deleted all ${allItems.length} inventory items.`)
        }

        if (onInventoryChanged) {
          await onInventoryChanged()
        } else {
          router.refresh()
        }
      } catch (error) {
        setDeleteMessage(
          error instanceof Error ? error.message : "Unable to delete all inventory items.",
        )
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!hasMounted || isPending}
          onClick={handleDeleteAll}
          variant="destructive"
        >
          {isPending ? <LoaderCircle className="animate-spin size-4" /> : <Trash2 className="size-4" />}
          Delete All
        </Button>

      <Sheet open={isImportOpen} onOpenChange={setIsImportOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <FileUp className="size-4" />
            Import
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto !max-w-none sm:!w-[92vw] lg:!w-[72vw]"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5 pr-14">
            <SheetTitle>Import Inventory CSV</SheetTitle>
            <SheetDescription>
              Upload a RocPay or FFLSafe CSV, review normalized rows, and confirm before anything is written.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-6 py-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Source format
                </p>
                <Select
                  value={importSource}
                  onValueChange={(value) => setImportSource(value as InventoryImportSource)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROCPAY">RocPay Inventory CSV</SelectItem>
                    <SelectItem value="FFLSAFE">FFLSafe CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Duplicate behavior
                </p>
                <Select
                  value={duplicateBehavior}
                  onValueChange={(value) =>
                    setDuplicateBehavior(value as DuplicateInventoryBehavior)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip-existing">Skip existing</SelectItem>
                    <SelectItem value="update-existing">Update existing</SelectItem>
                    <SelectItem value="create-duplicate">Create duplicate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                CSV file
              </p>
              <Input accept=".csv,text/csv" onChange={handleFileChange} type="file" />
              {fileName ? (
                <p className="text-xs text-muted-foreground">Loaded {fileName}</p>
              ) : null}
            </div>

            {preview ? (
              <div className="flex flex-col gap-4">
                {preview.missingHeaders.length > 0 ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    Missing required headers: {preview.missingHeaders.join(", ")}
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard label="Total rows" value={preview.summary.totalRows} />
                  <SummaryCard label="Valid rows" value={preview.summary.validRows} />
                  <SummaryCard label="Warning rows" value={preview.summary.warningRows} />
                  <SummaryCard label="Error rows" value={preview.summary.errorRows} />
                </div>

                <PreviewTable rows={preview.rows} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 px-5 py-10 text-sm text-muted-foreground">
                Upload a CSV to see validation results and a normalized inventory preview.
              </div>
            )}

            {importMessage ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground">
                {importMessage}
              </div>
            ) : null}

            {importResult?.failed.length ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-sm font-medium text-destructive">Failed rows</p>
                <div className="mt-2 flex flex-col gap-1">
                  {importResult.failed.map((failure) => (
                    <p key={`${failure.rowNumber}-${failure.reason}`} className="text-xs text-destructive">
                      Row {failure.rowNumber}: {failure.reason}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border/50 px-6 py-5 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                resetImportState()
                setIsImportOpen(false)
              }}
              type="button"
            >
              Close
            </Button>
            <Button
              disabled={
                isPending ||
                !preview ||
                preview.missingHeaders.length > 0 ||
                preview.summary.validRows === 0
              }
              onClick={handleImportConfirm}
              type="button"
            >
              {isPending ? <LoaderCircle className="animate-spin" /> : null}
              Confirm import
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isExportOpen} onOpenChange={setIsExportOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <Download className="size-4" />
            Export
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto !max-w-none sm:!w-[92vw] lg:!w-[56vw]"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5 pr-14">
            <SheetTitle>Export Inventory CSV</SheetTitle>
            <SheetDescription>
              Download RocPay inventory exports for all items or FFLSafe bound-book exports for firearms only.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-6 py-6">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Destination format
              </p>
              <Select
                value={exportDestination}
                onValueChange={(value) => setExportDestination(value as InventoryExportDestination)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROCPAY">RocPay CSV</SelectItem>
                  <SelectItem value="FFLSAFE">FFLSafe CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground">
              {exportDestination === "FFLSAFE"
                ? `${items.filter((item) => item.itemType === "FIREARM").length} firearm items will be included.`
                : `${items.length} inventory items will be included.`}
            </div>

            {exportWarnings.length > 0 ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <TriangleAlert className="size-4" />
                  <p className="text-sm font-medium">Compliance warnings</p>
                </div>
                <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-auto">
                  {exportWarnings.map((warning) => (
                    <p key={warning} className="text-xs text-amber-800">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border/50 px-6 py-5 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsExportOpen(false)} type="button">
              Close
            </Button>
            <Button
              disabled={
                exportDestination === "FFLSAFE" &&
                items.every((item) => item.itemType !== "FIREARM")
              }
              onClick={handleDownload}
              type="button"
            >
              Download CSV
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      </div>

      {deleteMessage ? (
        <p className="text-xs text-muted-foreground">{deleteMessage}</p>
      ) : null}
    </div>
  )
}
