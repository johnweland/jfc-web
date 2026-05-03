import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

import type { DuplicateInventoryBehavior } from "@/lib/inventory/csv/types"
import type { InventoryItem } from "@/lib/types/inventory"

const E2E_INVENTORY_STORE_PATH = "/private/tmp/jfc-e2e-inventory.json"

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
