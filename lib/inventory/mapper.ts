import type { Schema } from "@/amplify/data/resource"
import type {
  AcquisitionSourceType,
  InventoryApparelVariant,
  InventoryItem,
  InventoryImage,
  InventoryItemType,
  InventoryStatus,
  InventorySource,
  InventoryTaxMode,
  InventoryUnit,
  InventoryUnitStatus,
} from "@/lib/types/inventory"
import { normalizeInventoryCategory } from "@/lib/inventory/category"

type AmplifyRecord = Schema["InventoryItem"]["type"]
type AmplifyCreateInput = Schema["InventoryItem"]["createType"]
type AmplifyUpdateInput = Schema["InventoryItem"]["updateType"]
type AmplifyUnitRecord = Schema["InventoryUnit"]["type"]
type AmplifyUnitCreateInput = Schema["InventoryUnit"]["createType"]
type AmplifyUnitUpdateInput = Schema["InventoryUnit"]["updateType"]

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

function normalizeVariantPriceAdjustment(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) {
    return undefined
  }

  return value
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
    category:
      r.itemType !== "APPAREL"
        ? normalizeInventoryCategory(r.category ?? undefined, r.itemType as InventoryItemType)
        : undefined,
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
    taxMode: ((r.taxMode as string | null) ?? "DEFAULT") as InventoryTaxMode,
    customTaxRate: r.customTaxRate ?? undefined,
    sourceSystem: ((r.sourceSystem as string | null) ?? "MANUAL") as InventorySource,
    sourceId: (r.sourceId as string | null) ?? undefined,
    importBatchId: (r.importBatchId as string | null) ?? undefined,
    isSerialized: r.isSerialized ?? false,
    isOneOff: (r as { isOneOff?: boolean | null }).isOneOff ?? false,
    sourceType:
      ((r as { sourceType?: string | null }).sourceType as AcquisitionSourceType | null) ?? undefined,
    firearm:
      r.itemType === "FIREARM"
        ? {
            serialNumber: r.serialNumber ?? undefined,
            caliber: r.caliber ?? undefined,
            gauge: r.gauge ?? undefined,
            action: r.action ?? undefined,
            barrelLength: r.barrelLength ?? undefined,
            capacity: r.capacity ?? undefined,
            finish: r.condition ?? undefined,
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
            variants: apparelVariants?.map((variant) => ({
              ...variant,
              priceAdjustment: normalizeVariantPriceAdjustment(variant.priceAdjustment),
            })),
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
    taxMode: item.taxMode as AmplifyCreateInput["taxMode"],
    customTaxRate: item.customTaxRate,
    // Honor an explicit isSerialized flag from the form, otherwise infer it from a present serial.
    isSerialized:
      typeof item.isSerialized === "boolean"
        ? item.isSerialized
        : item.itemType === "FIREARM" && !!item.firearm?.serialNumber,
    isOneOff: item.isOneOff ?? false,
    sourceType: item.sourceType as AmplifyCreateInput["sourceType"],
    fflRequired: item.firearm?.requiresFflTransfer ?? false,
    description: item.description,
    manufacturer: item.manufacturer,
    brand: item.brand,
    model: item.model,
    sku: item.sku,
    upc: item.upc,
    cost: item.cost,
    category:
      item.itemType === "APPAREL"
        ? item.apparel?.apparelType
        : normalizeInventoryCategory(item.category, item.itemType),
    // Firearm fields (flat in schema)
    serialNumber: item.firearm?.serialNumber,
    caliber: item.firearm?.caliber,
    gauge: item.firearm?.gauge,
    action: item.firearm?.action,
    barrelLength: item.firearm?.barrelLength,
    capacity: item.firearm?.capacity,
    condition: item.firearm?.finish,
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
      ? JSON.stringify(
          item.apparel.variants.map((variant) => ({
            ...variant,
            priceAdjustment: normalizeVariantPriceAdjustment(variant.priceAdjustment),
          }))
        )
      : undefined,
    // Admin-only fields
    location: item.location,
    sourceId: item.sourceId,
    importBatchId: item.importBatchId,
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

// ---------------------------------------------------------------------------
// InventoryUnit ↔ Amplify
// ---------------------------------------------------------------------------

export function fromAmplifyUnitRecord(r: AmplifyUnitRecord): InventoryUnit {
  return {
    id: r.id,
    inventoryItemId: r.inventoryItemId,
    serialNumber: r.serialNumber,
    status: r.status as InventoryUnitStatus,
    location: r.location ?? undefined,
    cost: r.cost ?? undefined,
    acquisitionDate: r.acquisitionDate ?? undefined,
    acquisitionSourceName: r.acquisitionSourceName ?? undefined,
    acquisitionSourceFfl: r.acquisitionSourceFfl ?? undefined,
    sourceType: r.sourceType as AcquisitionSourceType,
    consignorName: r.consignorName ?? undefined,
    consignorContact: r.consignorContact ?? undefined,
    consignmentTerms: r.consignmentTerms ?? undefined,
    rocpayExportedAt: r.rocpayExportedAt ?? undefined,
    fflSafeExportedAt: r.fflSafeExportedAt ?? undefined,
    importBatchId: r.importBatchId ?? undefined,
    sourceSystem: (r.sourceSystem as InventorySource | null) ?? undefined,
    sourceId: r.sourceId ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt ?? new Date().toISOString(),
    updatedAt: r.updatedAt ?? new Date().toISOString(),
  }
}

export function toAmplifyUnitCreateInput(unit: InventoryUnit): AmplifyUnitCreateInput {
  return {
    id: unit.id,
    inventoryItemId: unit.inventoryItemId,
    serialNumber: unit.serialNumber,
    status: unit.status as AmplifyUnitCreateInput["status"],
    location: unit.location,
    cost: unit.cost,
    acquisitionDate: unit.acquisitionDate,
    acquisitionSourceName: unit.acquisitionSourceName,
    acquisitionSourceFfl: unit.acquisitionSourceFfl,
    sourceType: unit.sourceType as AmplifyUnitCreateInput["sourceType"],
    consignorName: unit.consignorName,
    consignorContact: unit.consignorContact,
    consignmentTerms: unit.consignmentTerms,
    rocpayExportedAt: unit.rocpayExportedAt,
    fflSafeExportedAt: unit.fflSafeExportedAt,
    importBatchId: unit.importBatchId,
    sourceSystem: unit.sourceSystem,
    sourceId: unit.sourceId,
    notes: unit.notes,
  }
}

export function toAmplifyUnitUpdateInput(unit: InventoryUnit): AmplifyUnitUpdateInput {
  return { ...toAmplifyUnitCreateInput(unit), id: unit.id }
}
