export type InventoryItemType = "FIREARM" | "PART" | "ACCESSORY" | "APPAREL" | "OTHER" | "SERVICES" | "AMMUNITION"
export type InventoryStatus = "DRAFT" | "AVAILABLE" | "RESERVED" | "SOLD" | "ARCHIVED"
export type InventorySource = "MANUAL" | "ROCPAY" | "FFLSAFE"
export type InventoryTaxMode = "DEFAULT" | "CATEGORY" | "CUSTOM" | "EXEMPT"

export type InventoryImage = {
  key: string    // S3 object key, e.g. "inventory/inv-001/abc123.jpg"
  url: string    // Public URL for display
  order: number  // Display order; 0 = primary/hero image
}

export type InventoryApparelVariant = {
  id: string
  size: string
  color: string
  colorHex?: string
  sku?: string
  quantity: number
}

export type InventoryItem = {
  id: string

  // Core identity
  itemType: InventoryItemType
  status: InventoryStatus

  name: string
  category?: string        // part subcategory: Optic, Magazine, Handguard, etc.
  description?: string
  manufacturer?: string
  brand?: string
  model?: string
  sku?: string
  upc?: string

  // Pricing / stock
  price: number
  cost?: number
  quantity: number
  location?: string
  taxMode: InventoryTaxMode
  customTaxRate?: number

  // Source tracking for imports/exports
  sourceSystem: InventorySource
  sourceId?: string
  importBatchId?: string

  // Firearm-specific fields
  firearm?: {
    serialNumber?: string
    caliber?: string
    gauge?: string
    action?: string
    barrelLength?: string
    capacity?: string
    finish?: string
    firearmType?: string
    requiresFflTransfer: boolean
  }

  // Apparel-specific fields
  apparel?: {
    apparelType?: string
    material?: string
    size?: string
    color?: string
    variants?: InventoryApparelVariant[]
  }

  // Images
  images?: InventoryImage[]

  // Audit
  createdAt: string
  updatedAt: string
}
