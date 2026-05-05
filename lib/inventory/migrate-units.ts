import "server-only"

import { listInventory } from "@/lib/inventory/data"
import {
  createInventoryUnit,
  listInventoryUnits,
} from "@/lib/inventory/units/data"
import type {
  AcquisitionSourceType,
  InventoryItem,
  InventoryStatus,
  InventoryUnitStatus,
} from "@/lib/types/inventory"

export type MigrateUnitsResult = {
  scanned: number
  created: number
  skipped: number
  /** Items inspected but left alone (already have ≥1 unit, or non-serialized). */
  alreadyMigrated: number
}

const ITEM_TO_UNIT_STATUS: Record<InventoryStatus, InventoryUnitStatus> = {
  DRAFT: "AVAILABLE",
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
  ARCHIVED: "REMOVED",
}

function inferSourceType(item: InventoryItem): AcquisitionSourceType {
  if (item.sourceType) return item.sourceType
  if (item.sourceSystem === "ROCPAY" || item.sourceSystem === "FFLSAFE") {
    return "IMPORTED"
  }
  return "MANUAL"
}

function isCandidate(item: InventoryItem) {
  return (
    item.isSerialized === true ||
    (item.itemType === "FIREARM" && Boolean(item.firearm?.serialNumber))
  )
}

/**
 * Idempotent backfill: for each InventoryItem that should be tracked per-unit,
 * ensure at least one InventoryUnit exists. Items that already have ≥1 unit are
 * left alone. Items that are not candidates (non-serialized, non-firearm) are
 * also skipped. Re-running this is safe.
 */
export async function migrateInventoryUnits(): Promise<MigrateUnitsResult> {
  const items = await listInventory()
  const result: MigrateUnitsResult = {
    scanned: items.length,
    created: 0,
    skipped: 0,
    alreadyMigrated: 0,
  }

  for (const item of items) {
    if (!isCandidate(item)) {
      result.skipped += 1
      continue
    }

    const existingUnits = await listInventoryUnits(item.id)
    if (existingUnits.length > 0) {
      result.alreadyMigrated += 1
      continue
    }

    const serialNumber =
      item.firearm?.serialNumber?.trim() || `MIGRATED-${item.id.slice(0, 8).toUpperCase()}`

    await createInventoryUnit({
      inventoryItemId: item.id,
      serialNumber,
      status: ITEM_TO_UNIT_STATUS[item.status],
      sourceType: inferSourceType(item),
      location: item.location,
      cost: item.cost,
      sourceSystem: item.sourceSystem,
      sourceId: item.sourceId,
      importBatchId: item.importBatchId,
      notes: "Backfilled from legacy InventoryItem.serialNumber",
    })

    result.created += 1
  }

  return result
}
