import type { InventoryItemType, InventoryTaxMode } from "@/lib/types/inventory"

export const TAX_SETTINGS_ID = "storefront"

export type TaxCategoryRates = Partial<Record<InventoryItemType, number | null>>
export type TaxCategoryExemptions = Partial<Record<InventoryItemType, boolean>>

export type StoreTaxSettings = {
  stateRate: number
  localRate: number
  defaultRate: number
  categoryRates: TaxCategoryRates
  categoryExemptions: TaxCategoryExemptions
}

export const EMPTY_TAX_SETTINGS: StoreTaxSettings = {
  stateRate: 0,
  localRate: 0,
  defaultRate: 0,
  categoryRates: {},
  categoryExemptions: {},
}

export function asPercent(rate: number) {
  return `${rate.toFixed(3).replace(/\.?0+$/, "")}%`
}

export function getDefaultTaxRate(stateRate: number, localRate: number) {
  return stateRate + localRate
}

export function resolveCategoryTaxRate(
  itemType: InventoryItemType,
  settings: StoreTaxSettings,
) {
  if (settings.categoryExemptions[itemType]) {
    return 0
  }

  const categoryRate = settings.categoryRates[itemType]
  return typeof categoryRate === "number" ? categoryRate : settings.defaultRate
}

export function resolveInventoryTaxRate(
  itemType: InventoryItemType,
  taxMode: InventoryTaxMode,
  customTaxRate: number | undefined,
  settings: StoreTaxSettings,
) {
  switch (taxMode) {
    case "EXEMPT":
      return 0
    case "CUSTOM":
      return typeof customTaxRate === "number"
        ? customTaxRate
        : settings.defaultRate
    case "CATEGORY":
      return resolveCategoryTaxRate(itemType, settings)
    case "DEFAULT":
    default:
      return settings.defaultRate
  }
}

export function calculateTaxAmount(subtotal: number, rate: number) {
  return subtotal * (rate / 100)
}
