import type { Schema } from "@/amplify/data/resource"
import type {
  InventoryApparelVariant,
  InventoryItem,
  InventoryImage,
  InventoryItemType,
  InventoryStatus,
  InventorySource,
} from "@/lib/types/inventory"

type AmplifyRecord = Schema["InventoryItem"]["type"]
type AmplifyCreateInput = Schema["InventoryItem"]["createType"]
type AmplifyUpdateInput = Schema["InventoryItem"]["updateType"]

function asInventoryImages(value: unknown): InventoryImage[] | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as InventoryImage[]
    } catch {
      return undefined
    }
  }

  if (Array.isArray(value)) {
    return value as InventoryImage[]
  }

  return undefined
}

function asApparelVariants(value: unknown): InventoryApparelVariant[] | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as InventoryApparelVariant[]
    } catch {
      return undefined
    }
  }

  if (Array.isArray(value)) {
    return value as InventoryApparelVariant[]
  }

  return undefined
}

// ---------------------------------------------------------------------------
// Amplify record → UI InventoryItem
// ---------------------------------------------------------------------------

export function fromAmplifyRecord(r: AmplifyRecord): InventoryItem {
  const images = asInventoryImages(r.images)
  const apparelVariants = asApparelVariants(r.apparelVariants)

  return {
    id: r.id,
    itemType: r.itemType as InventoryItemType,
    status: r.status as InventoryStatus,
    name: r.title,
    category: r.itemType !== "APPAREL" ? (r.category ?? undefined) : undefined,
    description: r.description ?? undefined,
    manufacturer: r.manufacturer ?? undefined,
    brand: r.brand ?? undefined,
    model: r.model ?? undefined,
    sku: r.sku ?? r.internalSku,
    upc: r.upc ?? undefined,
    price: r.unitPrice,
    cost: r.cost ?? undefined,
    quantity: r.quantity,
    location: (r.location as string | null) ?? undefined,
    sourceSystem: ((r.sourceSystem as string | null) ?? "MANUAL") as InventorySource,
    firearm:
      r.itemType === "FIREARM"
        ? {
            serialNumber: r.serialNumber ?? undefined,
            caliber: r.caliber ?? undefined,
            gauge: r.gauge ?? undefined,
            action: r.action ?? undefined,
            barrelLength: r.barrelLength ?? undefined,
            capacity: r.capacity ?? undefined,
            finish: undefined,
            firearmType: r.firearmType ?? undefined,
            requiresFflTransfer: r.fflRequired,
          }
        : undefined,
    apparel:
      r.itemType === "APPAREL" &&
      (r.category || r.material || r.size || r.color || apparelVariants?.length)
        ? {
            apparelType: r.category ?? undefined,
            material: r.material ?? undefined,
            size: r.size ?? undefined,
            color: r.color ?? undefined,
            variants: apparelVariants,
          }
        : undefined,
    images,
    createdAt: r.createdAt ?? new Date().toISOString(),
    updatedAt: r.updatedAt ?? new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// UI InventoryItem → Amplify create input
// ---------------------------------------------------------------------------

export function toAmplifyCreateInput(item: InventoryItem): AmplifyCreateInput {
  const uniqueVariantSizes = Array.from(
    new Set(item.apparel?.variants?.map((variant) => variant.size.trim()).filter(Boolean) ?? [])
  )
  const uniqueVariantColors = Array.from(
    new Set(item.apparel?.variants?.map((variant) => variant.color.trim()).filter(Boolean) ?? [])
  )

  return {
    id: item.id,
    // `internalSku` is required by the schema — use sku or generate a fallback
    internalSku: item.sku ?? `JFC-${item.id.slice(0, 8).toUpperCase()}`,
    title: item.name,
    itemType: item.itemType as AmplifyCreateInput["itemType"],
    status: item.status as AmplifyCreateInput["status"],
    unitPrice: item.price,
    quantity: item.quantity,
    isSerialized: item.itemType === "FIREARM" && !!item.firearm?.serialNumber,
    fflRequired: item.firearm?.requiresFflTransfer ?? false,
    description: item.description,
    manufacturer: item.manufacturer,
    brand: item.brand,
    model: item.model,
    sku: item.sku,
    upc: item.upc,
    cost: item.cost,
    category: item.itemType === "APPAREL" ? item.apparel?.apparelType : item.category,
    // Firearm fields (flat in schema)
    serialNumber: item.firearm?.serialNumber,
    caliber: item.firearm?.caliber,
    gauge: item.firearm?.gauge,
    action: item.firearm?.action,
    barrelLength: item.firearm?.barrelLength,
    capacity: item.firearm?.capacity,
    firearmType: item.firearm?.firearmType as AmplifyCreateInput["firearmType"],
    // Apparel fields (flat in schema)
    size:
      uniqueVariantSizes.length > 0
        ? uniqueVariantSizes.join(" / ")
        : item.apparel?.size,
    color:
      uniqueVariantColors.length > 0
        ? uniqueVariantColors.join(" / ")
        : item.apparel?.color,
    material: item.apparel?.material,
    apparelVariants: item.apparel?.variants
      ? JSON.stringify(item.apparel.variants)
      : undefined,
    // Admin-only fields
    location: item.location,
    sourceSystem: item.sourceSystem,
    images: item.images ? JSON.stringify(item.images) : undefined,
  }
}

// ---------------------------------------------------------------------------
// UI InventoryItem → Amplify update input
// ---------------------------------------------------------------------------

export function toAmplifyUpdateInput(item: InventoryItem): AmplifyUpdateInput {
  const { internalSku: _internalSku, ...rest } = toAmplifyCreateInput(item) as AmplifyCreateInput & { internalSku?: string }
  void _internalSku
  return { id: item.id, ...rest }
}
