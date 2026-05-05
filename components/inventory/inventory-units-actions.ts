"use server"

import {
  batchCreateInventoryUnits,
  createInventoryUnit,
  deleteInventoryUnit,
  listInventoryUnits,
  updateInventoryUnit,
} from "@/lib/inventory/units/data"
import type {
  AcquisitionSourceType,
  InventoryUnit,
  InventoryUnitStatus,
} from "@/lib/types/inventory"

export async function listInventoryUnitsAction(itemId?: string) {
  return listInventoryUnits(itemId)
}

export async function createUnitFromImportAction(
  inventoryItemId: string,
  partial: Partial<InventoryUnit>,
) {
  if (!partial.serialNumber) {
    throw new Error("createUnitFromImportAction: serialNumber is required")
  }
  return createInventoryUnit({
    inventoryItemId,
    serialNumber: partial.serialNumber,
    status: partial.status ?? "AVAILABLE",
    sourceType: partial.sourceType ?? "IMPORTED",
    location: partial.location,
    cost: partial.cost,
    acquisitionDate: partial.acquisitionDate,
    acquisitionSourceName: partial.acquisitionSourceName,
    acquisitionSourceFfl: partial.acquisitionSourceFfl,
    consignorName: partial.consignorName,
    consignorContact: partial.consignorContact,
    consignmentTerms: partial.consignmentTerms,
    importBatchId: partial.importBatchId,
    sourceSystem: partial.sourceSystem,
    sourceId: partial.sourceId,
    notes: partial.notes,
  })
}

export async function createUnitAction(input: {
  inventoryItemId: string
  serialNumber: string
  status: InventoryUnitStatus
  sourceType: AcquisitionSourceType
  location?: string
  cost?: number
  acquisitionDate?: string
  acquisitionSourceName?: string
  acquisitionSourceFfl?: string
  consignorName?: string
  consignorContact?: string
  consignmentTerms?: string
  notes?: string
}) {
  return createInventoryUnit(input)
}

export async function updateUnitAction(unit: InventoryUnit) {
  return updateInventoryUnit(unit)
}

export async function deleteUnitAction(id: string) {
  await deleteInventoryUnit(id)
}

export async function batchCreateUnitsAction(
  inventoryItemId: string,
  serialNumbers: string[],
  defaults: {
    sourceType: AcquisitionSourceType
    location?: string
    cost?: number
  },
) {
  return batchCreateInventoryUnits(inventoryItemId, serialNumbers, defaults)
}
