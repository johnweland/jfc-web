import "server-only"

import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"
import { cookies } from "next/headers"

import type { Schema } from "@/amplify/data/resource"
import { amplifyOutputs } from "@/lib/auth/amplify-server"
import {
  deleteE2eInventoryUnit,
  listE2eInventoryUnits,
  setE2eInventoryItems,
  listE2eInventoryItems,
  upsertE2eInventoryUnit,
} from "@/lib/inventory/e2e-store"
import {
  fromAmplifyUnitRecord,
  toAmplifyUnitCreateInput,
  toAmplifyUnitUpdateInput,
} from "@/lib/inventory/mapper"
import type { InventoryUnit } from "@/lib/types/inventory"

const UNIT_SELECTION = [
  "id",
  "inventoryItemId",
  "serialNumber",
  "status",
  "location",
  "cost",
  "acquisitionDate",
  "acquisitionSourceName",
  "acquisitionSourceFfl",
  "sourceType",
  "consignorName",
  "consignorContact",
  "consignmentTerms",
  "rocpayExportedAt",
  "fflSafeExportedAt",
  "importBatchId",
  "sourceSystem",
  "sourceId",
  "notes",
  "createdAt",
  "updatedAt",
] as const

const UNIT_LIST_LIMIT = 1000

function getClient() {
  return generateServerClientUsingCookies<Schema>({
    config: amplifyOutputs,
    cookies,
    authMode: "userPool",
  })
}

function isE2e() {
  return process.env.E2E_TEST_MODE === "1"
}

type UnitListResponse = {
  data?: Schema["InventoryUnit"]["type"][]
  errors?: readonly { message: string }[]
  nextToken?: string | null
}

async function listAllUnitRecords(
  filter?: { inventoryItemId?: string },
): Promise<Schema["InventoryUnit"]["type"][]> {
  const client = getClient()
  const records: Schema["InventoryUnit"]["type"][] = []
  let nextToken: string | null | undefined = undefined

  do {
    let response: UnitListResponse

    if (filter?.inventoryItemId) {
      response = await client.models.InventoryUnit.inventoryUnitsByInventoryItemId(
        { inventoryItemId: filter.inventoryItemId },
        { selectionSet: UNIT_SELECTION, limit: UNIT_LIST_LIMIT, nextToken },
      ) as UnitListResponse
    } else {
      response = await (
        client.models.InventoryUnit.list as (args: {
          selectionSet: readonly string[]
          limit: number
          nextToken?: string | null
        }) => Promise<UnitListResponse>
      )({ selectionSet: UNIT_SELECTION, limit: UNIT_LIST_LIMIT, nextToken })
    }

    if (response.errors?.length) {
      console.error("[inventory/units] list errors", response.errors)
    }

    records.push(...((response.data ?? []) as Schema["InventoryUnit"]["type"][]))
    nextToken = response.nextToken
  } while (nextToken)

  return records
}

export async function listInventoryUnits(itemId?: string): Promise<InventoryUnit[]> {
  if (isE2e()) {
    const all = listE2eInventoryUnits()
    return (itemId ? all.filter((u) => u.inventoryItemId === itemId) : all).sort(
      (a, b) => a.serialNumber.localeCompare(b.serialNumber),
    )
  }

  const records = await listAllUnitRecords(itemId ? { inventoryItemId: itemId } : undefined)
  return records
    .map(fromAmplifyUnitRecord)
    .sort((a, b) => a.serialNumber.localeCompare(b.serialNumber))
}

export async function listAllInventoryUnits(): Promise<InventoryUnit[]> {
  return listInventoryUnits()
}

export async function getInventoryUnit(id: string): Promise<InventoryUnit | null> {
  if (isE2e()) {
    return listE2eInventoryUnits().find((u) => u.id === id) ?? null
  }

  const client = getClient()
  const response = await client.models.InventoryUnit.get(
    { id },
    { selectionSet: UNIT_SELECTION },
  )

  if (response.errors?.length) {
    console.error("[inventory/units] get errors", response.errors)
  }

  if (!response.data) return null
  return fromAmplifyUnitRecord(response.data as Schema["InventoryUnit"]["type"])
}

/**
 * After a unit write, recompute the parent InventoryItem.quantity to equal the count
 * of AVAILABLE units. This keeps the public storefront read path (which only sees
 * `quantity`) in sync without needing public read access to InventoryUnit.
 */
async function syncParentQuantity(inventoryItemId: string) {
  const units = await listInventoryUnits(inventoryItemId)
  const available = units.filter((u) => u.status === "AVAILABLE").length

  if (isE2e()) {
    const items = listE2eInventoryItems()
    const idx = items.findIndex((i) => i.id === inventoryItemId)
    if (idx >= 0 && items[idx].isSerialized) {
      items[idx] = { ...items[idx], quantity: available, updatedAt: new Date().toISOString() }
      setE2eInventoryItems(items)
    }
    return
  }

  const client = getClient()
  // Only update quantity if the parent is serialized — guard against accidental
  // overwrites of manually-tracked quantities on non-serialized items.
  const parent = await client.models.InventoryItem.get(
    { id: inventoryItemId },
    { selectionSet: ["id", "isSerialized"] as const },
  )
  if (parent.data && (parent.data as { isSerialized?: boolean }).isSerialized) {
    await client.models.InventoryItem.update({ id: inventoryItemId, quantity: available })
  }
}

export async function createInventoryUnit(
  unit: Omit<InventoryUnit, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<InventoryUnit> {
  const now = new Date().toISOString()
  const full: InventoryUnit = {
    id: unit.id ?? crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...unit,
  }

  let saved: InventoryUnit
  if (isE2e()) {
    upsertE2eInventoryUnit(full)
    saved = full
  } else {
    const client = getClient()
    const response = await client.models.InventoryUnit.create(toAmplifyUnitCreateInput(full))
    if (response.errors?.length) {
      throw new Error(response.errors.map((e) => e.message).join("; "))
    }
    saved = fromAmplifyUnitRecord(response.data as Schema["InventoryUnit"]["type"])
  }

  await syncParentQuantity(saved.inventoryItemId)
  return saved
}

export async function updateInventoryUnit(unit: InventoryUnit): Promise<InventoryUnit> {
  let saved: InventoryUnit
  if (isE2e()) {
    upsertE2eInventoryUnit({ ...unit, updatedAt: new Date().toISOString() })
    saved = unit
  } else {
    const client = getClient()
    const response = await client.models.InventoryUnit.update(toAmplifyUnitUpdateInput(unit))
    if (response.errors?.length) {
      throw new Error(response.errors.map((e) => e.message).join("; "))
    }
    saved = fromAmplifyUnitRecord(response.data as Schema["InventoryUnit"]["type"])
  }

  await syncParentQuantity(saved.inventoryItemId)
  return saved
}

export async function deleteInventoryUnit(id: string): Promise<void> {
  const existing = await getInventoryUnit(id)
  if (!existing) return

  if (isE2e()) {
    deleteE2eInventoryUnit(id)
  } else {
    const client = getClient()
    const response = await client.models.InventoryUnit.delete({ id })
    if (response.errors?.length) {
      throw new Error(response.errors.map((e) => e.message).join("; "))
    }
  }

  await syncParentQuantity(existing.inventoryItemId)
}

/**
 * Bulk-create units from a batch of serial numbers under one InventoryItem.
 * `defaults` is applied to every unit; `serialNumbers` already deduplicated by caller.
 */
export async function batchCreateInventoryUnits(
  inventoryItemId: string,
  serialNumbers: string[],
  defaults: Partial<Omit<InventoryUnit, "id" | "inventoryItemId" | "serialNumber" | "createdAt" | "updatedAt">>,
): Promise<InventoryUnit[]> {
  const created: InventoryUnit[] = []
  for (const serial of serialNumbers) {
    const unit = await createInventoryUnit({
      inventoryItemId,
      serialNumber: serial,
      status: defaults.status ?? "AVAILABLE",
      sourceType: defaults.sourceType ?? "PURCHASED",
      location: defaults.location,
      cost: defaults.cost,
      acquisitionDate: defaults.acquisitionDate,
      acquisitionSourceName: defaults.acquisitionSourceName,
      acquisitionSourceFfl: defaults.acquisitionSourceFfl,
      consignorName: defaults.consignorName,
      consignorContact: defaults.consignorContact,
      consignmentTerms: defaults.consignmentTerms,
      importBatchId: defaults.importBatchId,
      sourceSystem: defaults.sourceSystem,
      sourceId: defaults.sourceId,
      notes: defaults.notes,
    })
    created.push(unit)
  }
  return created
}
