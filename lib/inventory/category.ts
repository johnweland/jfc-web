import type { InventoryItemType } from "@/lib/types/inventory"

export function isAmmunitionCategory(category?: string | null) {
  const normalized = category?.trim().toLowerCase()
  return normalized === "ammo" || normalized === "ammunition"
}

export function normalizeInventoryCategory(
  category?: string | null,
  itemType?: InventoryItemType,
) {
  const trimmed = category?.trim()

  if (!trimmed) {
    return undefined
  }

  if (itemType === "AMMUNITION" && isAmmunitionCategory(trimmed)) {
    return "Ammunition"
  }

  return trimmed
}
