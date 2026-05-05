import type {
  InventoryItem,
  InventoryUnit,
  InventoryUnitStatus,
} from "@/lib/types/inventory"

export type UnitCounts = {
  total: number
  AVAILABLE: number
  RESERVED: number
  SOLD: number
  TRANSFERRED: number
  CONSIGNED: number
  RETURNED: number
  LOST_DAMAGED: number
  REMOVED: number
}

const ZERO_COUNTS: UnitCounts = {
  total: 0,
  AVAILABLE: 0,
  RESERVED: 0,
  SOLD: 0,
  TRANSFERRED: 0,
  CONSIGNED: 0,
  RETURNED: 0,
  LOST_DAMAGED: 0,
  REMOVED: 0,
}

export function getUnitCounts(units: InventoryUnit[] | undefined): UnitCounts {
  if (!units?.length) return { ...ZERO_COUNTS }
  const counts: UnitCounts = { ...ZERO_COUNTS }
  for (const unit of units) {
    counts.total += 1
    counts[unit.status] = (counts[unit.status] ?? 0) + 1
  }
  return counts
}

/**
 * For serialized items, available quantity is the count of units in AVAILABLE status.
 * For non-serialized items, the manually-tracked `quantity` field on the item is the
 * source of truth. This function is the single read path so callers don't have to
 * branch on `isSerialized` themselves.
 */
export function getAvailableQuantity(
  item: Pick<InventoryItem, "isSerialized" | "quantity">,
  units?: InventoryUnit[],
): number {
  if (item.isSerialized) {
    if (!units) return 0
    let n = 0
    for (const unit of units) {
      if (unit.status === "AVAILABLE") n += 1
    }
    return n
  }
  return item.quantity
}

const UNIT_STATUS_PRIORITY: InventoryUnitStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "CONSIGNED",
  "TRANSFERRED",
  "RETURNED",
  "SOLD",
  "LOST_DAMAGED",
  "REMOVED",
]

/**
 * For serialized items, derive a representative item-level status from the unit pool.
 * Returns AVAILABLE if any unit is AVAILABLE; otherwise the highest-priority status
 * present; otherwise SOLD when there are units but none are sellable; otherwise the
 * item's own status (for items with no units yet).
 */
export function getEffectiveStatus(
  item: Pick<InventoryItem, "isSerialized" | "status">,
  units?: InventoryUnit[],
): InventoryItem["status"] {
  if (!item.isSerialized || !units?.length) return item.status
  const counts = getUnitCounts(units)
  if (counts.AVAILABLE > 0) return "AVAILABLE"
  for (const status of UNIT_STATUS_PRIORITY) {
    if (counts[status] > 0) {
      if (status === "RESERVED") return "RESERVED"
      if (status === "TRANSFERRED" || status === "REMOVED") return "ARCHIVED"
      return "SOLD"
    }
  }
  return item.status
}
