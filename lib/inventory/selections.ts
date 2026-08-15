/**
 * Inventory fields that may be returned to the customer-facing catalog.
 *
 * Keep this separate from the admin selection sets so a storefront request can
 * never accidentally ask AppSync for staff-only inventory data.
 */
export const PUBLIC_LEGACY_INVENTORY_SELECTION = [
  "id",
  "internalSku",
  "sku",
  "upc",
  "itemType",
  "category",
  "title",
  "description",
  "manufacturer",
  "brand",
  "model",
  "condition",
  "status",
  "isSerialized",
  "quantity",
  "unitPrice",
  "caliber",
  "gauge",
  "action",
  "barrelLength",
  "capacity",
  "firearmType",
  "fflRequired",
  "size",
  "color",
  "material",
  "apparelVariants",
  "images",
  "createdAt",
  "updatedAt",
] as const

export const PUBLIC_INVENTORY_SELECTION = [
  ...PUBLIC_LEGACY_INVENTORY_SELECTION,
  "taxMode",
  "customTaxRate",
  "isOneOff",
] as const
