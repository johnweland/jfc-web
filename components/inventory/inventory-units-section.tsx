"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Pencil, Boxes } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

import { InventoryUnitStatusBadge } from "./inventory-badges"
import {
  createUnitAction,
  batchCreateUnitsAction,
  deleteUnitAction,
  updateUnitAction,
} from "./inventory-units-actions"
import { getUnitCounts } from "@/lib/inventory/availability"
import type {
  AcquisitionSourceType,
  InventoryUnit,
  InventoryUnitStatus,
} from "@/lib/types/inventory"

const UNIT_STATUSES: InventoryUnitStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "TRANSFERRED",
  "CONSIGNED",
  "RETURNED",
  "LOST_DAMAGED",
  "REMOVED",
]

const SOURCE_TYPES: AcquisitionSourceType[] = [
  "PURCHASED",
  "CONSIGNMENT",
  "TRANSFER",
  "MANUAL",
  "IMPORTED",
]

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[10px] font-semibold uppercase text-muted-foreground"
      style={{ letterSpacing: "0.12em" }}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
  )
}

function CountBadge({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[10px] font-semibold uppercase text-muted-foreground"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </span>
      <span className={`font-display text-2xl font-bold ${tone}`}>{value}</span>
    </div>
  )
}

type UnitFormState = Partial<InventoryUnit> & { serialNumber: string }

function emptyUnit(inventoryItemId: string): UnitFormState {
  return {
    inventoryItemId,
    serialNumber: "",
    status: "AVAILABLE",
    sourceType: "PURCHASED",
  }
}

export function InventoryUnitsSection({
  inventoryItemId,
  isOneOff,
  initialUnits,
}: {
  inventoryItemId: string
  isOneOff: boolean
  initialUnits: InventoryUnit[]
}) {
  const router = useRouter()
  const [units, setUnits] = useState(initialUnits)
  const [editing, setEditing] = useState<UnitFormState | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => getUnitCounts(units), [units])

  const knownSerials = useMemo(
    () => new Set(units.map((u) => u.serialNumber.trim().toLowerCase())),
    [units],
  )

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleSaveSingle(form: UnitFormState) {
    setError(null)
    const trimmed = form.serialNumber.trim()
    if (!trimmed) {
      setError("Serial number is required.")
      return
    }
    const dupe =
      knownSerials.has(trimmed.toLowerCase()) &&
      (!form.id || !units.some((u) => u.id === form.id && u.serialNumber === trimmed))
    if (dupe) {
      setError(`A unit with serial "${trimmed}" already exists for this product.`)
      return
    }

    try {
      if (form.id) {
        const updated = await updateUnitAction({
          ...form,
          id: form.id,
          serialNumber: trimmed,
          inventoryItemId,
        } as InventoryUnit)
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      } else {
        const created = await createUnitAction({
          ...form,
          serialNumber: trimmed,
          inventoryItemId,
          status: form.status ?? "AVAILABLE",
          sourceType: form.sourceType ?? "PURCHASED",
        })
        setUnits((prev) => [...prev, created])
      }
      setEditing(null)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save unit.")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this unit? This cannot be undone.")) return
    setError(null)
    try {
      await deleteUnitAction(id)
      setUnits((prev) => prev.filter((u) => u.id !== id))
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete unit.")
    }
  }

  return (
    <Card className="border-border/60 bg-surface-container-low">
      <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between gap-4">
        <CardTitle
          className="text-sm font-semibold uppercase text-foreground flex items-center gap-2"
          style={{ letterSpacing: "0.1em" }}
        >
          <Boxes className="size-4" />
          Serialized Units
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs uppercase"
            onClick={() => setBatchOpen(true)}
          >
            Bulk Add
          </Button>
          <Button
            type="button"
            size="sm"
            className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0 text-xs"
            style={{ letterSpacing: "0.12em" }}
            onClick={() => setEditing(emptyUnit(inventoryItemId))}
          >
            <Plus className="size-3.5 mr-1" /> Add Unit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 flex flex-col gap-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 p-4 bg-surface-container border border-border/40">
          <CountBadge label="Available" value={counts.AVAILABLE} tone="text-green-400" />
          <CountBadge label="Reserved" value={counts.RESERVED} tone="text-yellow-400" />
          <CountBadge label="Sold" value={counts.SOLD} tone="text-red-400" />
          <CountBadge label="Transferred" value={counts.TRANSFERRED} tone="text-blue-400" />
          <CountBadge label="Consigned" value={counts.CONSIGNED} tone="text-purple-400" />
          <CountBadge label="Total" value={counts.total} tone="text-foreground" />
        </div>

        {error && (
          <div className="text-xs text-destructive border border-destructive/40 bg-destructive/10 px-3 py-2">
            {error}
          </div>
        )}

        <Table className="bg-surface-container-low">
          <TableHeader className="bg-surface-container border-border/40">
            <TableRow>
              <TableHead
                className="text-[10px] font-semibold uppercase text-muted-foreground h-9 px-4"
                style={{ letterSpacing: "0.12em" }}
              >
                Serial
              </TableHead>
              <TableHead
                className="text-[10px] font-semibold uppercase text-muted-foreground h-9 px-4"
                style={{ letterSpacing: "0.12em" }}
              >
                Status
              </TableHead>
              <TableHead
                className="text-[10px] font-semibold uppercase text-muted-foreground h-9 px-4"
                style={{ letterSpacing: "0.12em" }}
              >
                Location
              </TableHead>
              <TableHead
                className="text-[10px] font-semibold uppercase text-muted-foreground h-9 px-4"
                style={{ letterSpacing: "0.12em" }}
              >
                Cost
              </TableHead>
              <TableHead
                className="text-[10px] font-semibold uppercase text-muted-foreground h-9 px-4"
                style={{ letterSpacing: "0.12em" }}
              >
                Source
              </TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  No units yet. Add one or bulk-add a list of serial numbers.
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-mono text-xs">{unit.serialNumber}</TableCell>
                  <TableCell>
                    <InventoryUnitStatusBadge status={unit.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {unit.location ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {typeof unit.cost === "number" ? `$${unit.cost.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs uppercase text-muted-foreground">
                    {unit.sourceType}
                  </TableCell>
                  <TableCell className="flex items-center gap-1 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing({ ...unit })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(unit.id)}
                      disabled={pending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <UnitFormSheet
        open={Boolean(editing)}
        unit={editing}
        isOneOff={isOneOff}
        onClose={() => setEditing(null)}
        onSubmit={handleSaveSingle}
      />

      <BatchAddSheet
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        existingSerials={knownSerials}
        onSubmit={async (serials, defaults) => {
          setError(null)
          try {
            const created = await batchCreateUnitsAction(inventoryItemId, serials, defaults)
            setUnits((prev) => [...prev, ...created])
            setBatchOpen(false)
            refresh()
          } catch (e) {
            setError(e instanceof Error ? e.message : "Bulk add failed.")
          }
        }}
      />
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Single-unit form (Sheet)
// ---------------------------------------------------------------------------

function UnitFormSheet({
  open,
  unit,
  isOneOff,
  onClose,
  onSubmit,
}: {
  open: boolean
  unit: UnitFormState | null
  isOneOff: boolean
  onClose: () => void
  onSubmit: (form: UnitFormState) => Promise<void>
}) {
  const [form, setForm] = useState<UnitFormState | null>(unit)
  // Re-sync when parent opens with a different unit
  if (form?.id !== unit?.id || (open && !form && unit)) {
    setForm(unit)
  }

  if (!form) return null

  const showConsignment = form.sourceType === "CONSIGNMENT" || isOneOff

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle
            className="font-display text-xl uppercase"
            style={{ letterSpacing: "-0.02em" }}
          >
            {form.id ? "Edit Unit" : "Add Unit"}
          </SheetTitle>
        </SheetHeader>

        <form
          className="flex flex-col gap-4 mt-6 px-4 pb-6"
          onSubmit={async (e) => {
            e.preventDefault()
            await onSubmit(form)
          }}
        >
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="unit-serial" required>
              Serial Number
            </FieldLabel>
            <Input
              id="unit-serial"
              required
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              className="h-9 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="unit-status">Status</FieldLabel>
              <Select
                value={form.status ?? "AVAILABLE"}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as InventoryUnitStatus })
                }
              >
                <SelectTrigger id="unit-status" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="unit-source-type">Source Type</FieldLabel>
              <Select
                value={form.sourceType ?? "PURCHASED"}
                onValueChange={(v) =>
                  setForm({ ...form, sourceType: v as AcquisitionSourceType })
                }
              >
                <SelectTrigger id="unit-source-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="unit-location">Location</FieldLabel>
              <Input
                id="unit-location"
                value={form.location ?? ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. CASE-A1"
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="unit-cost">Cost</FieldLabel>
              <Input
                id="unit-cost"
                type="number"
                step="0.01"
                value={typeof form.cost === "number" ? form.cost : ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cost: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="unit-acq-date">Acquisition Date</FieldLabel>
              <Input
                id="unit-acq-date"
                type="date"
                value={form.acquisitionDate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, acquisitionDate: e.target.value || undefined })
                }
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="unit-acq-source">Acquired From</FieldLabel>
              <Input
                id="unit-acq-source"
                value={form.acquisitionSourceName ?? ""}
                onChange={(e) =>
                  setForm({ ...form, acquisitionSourceName: e.target.value })
                }
                placeholder="Distributor / consignor name"
                className="h-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="unit-acq-ffl">Source FFL</FieldLabel>
            <Input
              id="unit-acq-ffl"
              value={form.acquisitionSourceFfl ?? ""}
              onChange={(e) => setForm({ ...form, acquisitionSourceFfl: e.target.value })}
              placeholder="FFL #"
              className="h-9"
            />
          </div>

          {showConsignment && (
            <div className="flex flex-col gap-3 p-3 border border-border/40 bg-surface-container">
              <p
                className="text-[10px] font-semibold uppercase text-primary"
                style={{ letterSpacing: "0.12em" }}
              >
                Consignment
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="unit-consignor-name">Consignor</FieldLabel>
                  <Input
                    id="unit-consignor-name"
                    value={form.consignorName ?? ""}
                    onChange={(e) => setForm({ ...form, consignorName: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="unit-consignor-contact">Contact</FieldLabel>
                  <Input
                    id="unit-consignor-contact"
                    value={form.consignorContact ?? ""}
                    onChange={(e) => setForm({ ...form, consignorContact: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="unit-consignor-terms">Terms</FieldLabel>
                <Textarea
                  id="unit-consignor-terms"
                  rows={2}
                  className="resize-none"
                  value={form.consignmentTerms ?? ""}
                  onChange={(e) => setForm({ ...form, consignmentTerms: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="unit-notes">Notes</FieldLabel>
            <Textarea
              id="unit-notes"
              rows={3}
              className="resize-none"
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0"
              style={{ letterSpacing: "0.12em" }}
            >
              Save
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Batch-add Sheet (textarea, one serial per line)
// ---------------------------------------------------------------------------

function BatchAddSheet({
  open,
  onClose,
  existingSerials,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  existingSerials: Set<string>
  onSubmit: (
    serials: string[],
    defaults: { sourceType: AcquisitionSourceType; location?: string; cost?: number },
  ) => Promise<void>
}) {
  const [text, setText] = useState("")
  const [sourceType, setSourceType] = useState<AcquisitionSourceType>("PURCHASED")
  const [location, setLocation] = useState("")
  const [cost, setCost] = useState("")

  const parsed = useMemo(() => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    const seen = new Set<string>()
    const fresh: string[] = []
    const inFile: string[] = []
    const inDb: string[] = []
    for (const line of lines) {
      const lower = line.toLowerCase()
      if (existingSerials.has(lower)) {
        inDb.push(line)
        continue
      }
      if (seen.has(lower)) {
        inFile.push(line)
        continue
      }
      seen.add(lower)
      fresh.push(line)
    }
    return { fresh, inFile, inDb }
  }, [text, existingSerials])

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle
            className="font-display text-xl uppercase"
            style={{ letterSpacing: "-0.02em" }}
          >
            Bulk Add Units
          </SheetTitle>
        </SheetHeader>

        <form
          className="flex flex-col gap-4 mt-6 px-4 pb-6"
          onSubmit={async (e) => {
            e.preventDefault()
            if (parsed.fresh.length === 0) return
            await onSubmit(parsed.fresh, {
              sourceType,
              location: location.trim() || undefined,
              cost: cost ? Number(cost) : undefined,
            })
            setText("")
            setLocation("")
            setCost("")
          }}
        >
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="batch-serials" required>
              Serial Numbers (one per line)
            </FieldLabel>
            <Textarea
              id="batch-serials"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="font-mono text-xs resize-none"
              placeholder={"ABC123\nDEF456\nGHI789"}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="batch-source-type">Source Type</FieldLabel>
              <Select
                value={sourceType}
                onValueChange={(v) => setSourceType(v as AcquisitionSourceType)}
              >
                <SelectTrigger id="batch-source-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="batch-location">Location</FieldLabel>
              <Input
                id="batch-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="batch-cost">Cost (each)</FieldLabel>
              <Input
                id="batch-cost"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <CountBadge label="Will Add" value={parsed.fresh.length} tone="text-green-400" />
            <CountBadge
              label="Dup In File"
              value={parsed.inFile.length}
              tone="text-yellow-400"
            />
            <CountBadge label="Already Exist" value={parsed.inDb.length} tone="text-red-400" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={parsed.fresh.length === 0}
              className="gradient-primary text-primary-foreground font-bold uppercase rounded-none border-0"
              style={{ letterSpacing: "0.12em" }}
            >
              Add {parsed.fresh.length} Unit{parsed.fresh.length === 1 ? "" : "s"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
