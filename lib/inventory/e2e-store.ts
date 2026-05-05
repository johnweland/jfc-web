import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { tmpdir } from "node:os"

import type { DuplicateInventoryBehavior } from "@/lib/inventory/csv/types"
import type { InventoryItem, InventoryUnit } from "@/lib/types/inventory"

const E2E_INVENTORY_STORE_PATH = `${tmpdir()}/jfc-e2e-inventory.json`
const E2E_INVENTORY_UNIT_STORE_PATH = `${tmpdir()}/jfc-e2e-inventory-units.json`

function cloneItem(item: InventoryItem): InventoryItem {
  return JSON.parse(JSON.stringify(item)) as InventoryItem
}

function ensureStoreDirectory() {
  mkdirSync(dirname(E2E_INVENTORY_STORE_PATH), { recursive: true })
}

function readStore(): InventoryItem[] {
  try {
    const raw = readFileSync(E2E_INVENTORY_STORE_PATH, "utf8")
    const parsed = JSON.parse(raw) as InventoryItem[]
    return parsed.map(cloneItem)
  } catch {
    return []
  }
}

function writeStore(items: InventoryItem[]) {
  ensureStoreDirectory()
  writeFileSync(E2E_INVENTORY_STORE_PATH, JSON.stringify(items.map(cloneItem)), "utf8")
}

export function listE2eInventoryItems() {
  return readStore()
}

export function resetE2eInventoryItems() {
  writeStore([])
}

export function setE2eInventoryItems(items: InventoryItem[]) {
  writeStore(items)
}

export function importE2eInventoryItems(
  rows: InventoryItem[],
  duplicateBehavior: DuplicateInventoryBehavior,
) {
  const store = readStore()
  let created = 0
  let updated = 0
  const skipped: Array<{ rowNumber: number; reason: string }> = []

  for (const [index, row] of rows.entries()) {
    const existingIndex = store.findIndex(
      (item) =>
        (row.sourceSystem && row.sourceId
          ? item.sourceSystem === row.sourceSystem && item.sourceId === row.sourceId
          : false) ||
        (row.sku ? item.sku === row.sku : false),
    )

    if (existingIndex >= 0 && duplicateBehavior === "skip-existing") {
      skipped.push({
        rowNumber: index + 2,
        reason: `Skipped existing SKU ${row.sku ?? row.name}.`,
      })
      continue
    }

    if (existingIndex >= 0 && duplicateBehavior === "update-existing") {
      store[existingIndex] = cloneItem({
        ...store[existingIndex],
        ...row,
        createdAt: store[existingIndex].createdAt,
      })
      updated += 1
      continue
    }

    store.push(cloneItem(row))
    created += 1
  }

  writeStore(store)

  return {
    created,
    updated,
    skipped,
    failed: [] as Array<{ rowNumber: number; reason: string }>,
  }
}

// ---------------------------------------------------------------------------
// E2E InventoryUnit store
// ---------------------------------------------------------------------------

function cloneUnit(unit: InventoryUnit): InventoryUnit {
  return JSON.parse(JSON.stringify(unit)) as InventoryUnit
}

function readUnitStore(): InventoryUnit[] {
  try {
    const raw = readFileSync(E2E_INVENTORY_UNIT_STORE_PATH, "utf8")
    const parsed = JSON.parse(raw) as InventoryUnit[]
    return parsed.map(cloneUnit)
  } catch {
    return []
  }
}

function writeUnitStore(units: InventoryUnit[]) {
  mkdirSync(dirname(E2E_INVENTORY_UNIT_STORE_PATH), { recursive: true })
  writeFileSync(E2E_INVENTORY_UNIT_STORE_PATH, JSON.stringify(units.map(cloneUnit)), "utf8")
}

export function listE2eInventoryUnits() {
  return readUnitStore()
}

export function resetE2eInventoryUnits() {
  writeUnitStore([])
}

export function setE2eInventoryUnits(units: InventoryUnit[]) {
  writeUnitStore(units)
}

export function upsertE2eInventoryUnit(unit: InventoryUnit) {
  const store = readUnitStore()
  const idx = store.findIndex((u) => u.id === unit.id)
  if (idx >= 0) {
    store[idx] = cloneUnit({ ...store[idx], ...unit })
  } else {
    store.push(cloneUnit(unit))
  }
  writeUnitStore(store)
}

export function deleteE2eInventoryUnit(id: string) {
  const store = readUnitStore()
  writeUnitStore(store.filter((u) => u.id !== id))
}
