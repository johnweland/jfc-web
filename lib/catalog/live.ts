import "server-only"

import { cache } from "react"
import {
  getAllProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductsByCategory,
} from "@/lib/data"
import { isAmplifyDataConfigured } from "@/lib/auth/amplify-server"
import { listPublicInventory } from "@/lib/inventory/data"
import { refreshInventoryImages } from "@/lib/inventory/image-urls"
import { getStoreTaxSettings } from "@/lib/tax/settings"
import { resolveInventoryTaxRate } from "@/lib/tax/shared"
import { DEFAULT_APPAREL_SIZE, sortApparelSizes } from "@/lib/data/apparel-sizes"
import type { InventoryImage, InventoryItem } from "@/lib/types/inventory"
import type {
  Apparel,
  ApparelVariant,
  AvailabilityStatus,
  ColorSwatch,
  Firearm,
  FirearmType,
  Part,
  Product,
  ProductCategory,
} from "@/lib/data/types"

type CategoryProductMap = {
  firearm: Firearm
  part: Part
  apparel: Apparel
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toProductSlug(item: InventoryItem) {
  const baseSlug = slugify(item.name || item.sku || item.id)
  const uniqueToken = slugify(item.sku || item.id)

  if (!uniqueToken || uniqueToken === baseSlug || baseSlug.endsWith(`-${uniqueToken}`)) {
    return baseSlug
  }

  return `${baseSlug}-${uniqueToken}`
}

function splitDelimitedValues(value?: string) {
  if (!value) {
    return []
  }

  return value
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
}

function toAvailabilityStatus(item: InventoryItem): AvailabilityStatus | null {
  if (item.status === "DRAFT" || item.status === "ARCHIVED" || item.status === "SOLD") {
    return null
  }

  if (item.quantity <= 0) {
    return "backordered"
  }

  if (item.status === "RESERVED" || item.quantity === 1) {
    return "low_stock"
  }

  return "in_stock"
}

function toFirearmType(value?: string): FirearmType {
  switch (value) {
    case "HANDGUN":
      return "handgun"
    case "RIFLE":
      return "rifle"
    case "RECEIVER":
      return "receiver"
    case "SHOTGUN":
      return "shotgun"
    default:
      return "other"
  }
}

function defaultColorHex(name: string) {
  const normalized = name.trim().toLowerCase()

  if (normalized.includes("black")) return "#1c1c1c"
  if (normalized.includes("red") || normalized.includes("crimson")) return "#9f1d22"
  if (normalized.includes("burgundy") || normalized.includes("maroon")) return "#6f1d2a"
  if (normalized.includes("orange")) return "#c65a1e"
  if (normalized.includes("yellow") || normalized.includes("gold")) return "#c2a03a"
  if (normalized.includes("blue")) return "#2a4f8f"
  if (normalized.includes("charcoal")) return "#3d3d3d"
  if (normalized.includes("green") || normalized.includes("od")) return "#4a5240"
  if (normalized.includes("navy")) return "#1a2744"
  if (normalized.includes("tan") || normalized.includes("sand") || normalized.includes("coyote")) {
    return "#c2b280"
  }
  if (normalized.includes("grey") || normalized.includes("gray")) return "#7b7b7b"
  if (normalized.includes("white")) return "#f5f3ef"

  return "#81724a"
}

function toColorSwatches(item: InventoryItem): ColorSwatch[] {
  const variantSwatches =
    item.apparel?.variants?.map((variant) => ({
      name: variant.color,
      hex: variant.colorHex || defaultColorHex(variant.color),
    })) ?? []

  const summarySwatches = splitDelimitedValues(item.apparel?.color).map((color) => ({
    name: color,
    hex: defaultColorHex(color),
  }))

  return Array.from(
    new Map(
      [...variantSwatches, ...summarySwatches]
        .filter((swatch) => swatch.name)
        .map((swatch) => [swatch.name, swatch]),
    ).values(),
  )
}

async function resolveImageUrls(images?: InventoryImage[], placeholder = "/placeholder.svg") {
  if (!images?.length) {
    return [placeholder]
  }

  const orderedImages = [...images].sort((a, b) => a.order - b.order)
  const hydratedImages = await refreshInventoryImages(orderedImages)
  const urls = hydratedImages?.map((image) => image.url) ?? []

  const resolved = urls.filter((url): url is string => Boolean(url))
  return resolved.length > 0 ? resolved : [placeholder]
}

async function toFirearmProduct(
  item: InventoryItem,
  status: AvailabilityStatus,
  taxRate: number,
): Promise<Firearm> {
  return {
    slug: toProductSlug(item),
    name: item.name,
    sku: item.sku ?? item.id,
    price: item.price,
    availableQuantity: item.quantity,
    taxRate,
    status,
    category: "firearm",
    type: toFirearmType(item.firearm?.firearmType),
    caliber: item.firearm?.caliber ?? item.firearm?.gauge ?? "N/A",
    barrelLength: item.firearm?.barrelLength ?? "N/A",
    overallLength: "N/A",
    weight: "N/A",
    capacity: item.firearm?.capacity ?? "N/A",
    action: item.firearm?.action ?? "N/A",
    finish: item.firearm?.finish ?? "N/A",
    requiresFFL: true,
    manufacturer: item.manufacturer ?? item.brand ?? "Jackson Firearm Co",
    images: await resolveImageUrls(item.images, "/placeholder.svg"),
    description: item.description ?? "Product details coming soon.",
    serialTag: item.firearm?.serialNumber,
    series: item.model,
  }
}

async function toPartProduct(
  item: InventoryItem,
  status: AvailabilityStatus,
  taxRate: number,
): Promise<Part> {
  const compatibility = [item.manufacturer, item.brand, item.model].filter(
    (value): value is string => Boolean(value),
  )

  return {
    slug: toProductSlug(item),
    name: item.name,
    sku: item.sku ?? item.id,
    price: item.price,
    availableQuantity: item.quantity,
    taxRate,
    status,
    category: "part",
    partType: item.category ?? item.model ?? item.brand ?? item.manufacturer ?? "Component",
    compatibility: compatibility.length > 0 ? compatibility : ["General Use"],
    images: await resolveImageUrls(item.images, "/placeholder.svg"),
    description: item.description ?? "Product details coming soon.",
    requiresFFL: false,
  }
}

async function toApparelProduct(
  item: InventoryItem,
  status: AvailabilityStatus,
  taxRate: number,
): Promise<Apparel> {
  const variants: ApparelVariant[] | undefined = item.apparel?.variants?.map((variant) => ({
    id: variant.id,
    size: variant.size.trim(),
    color: variant.color.trim(),
    colorHex: variant.colorHex,
    sku: variant.sku,
    quantity: variant.quantity,
  }))

  const sizes = sortApparelSizes([
    ...(variants?.map((variant) => variant.size).filter(Boolean) ?? []),
    ...splitDelimitedValues(item.apparel?.size),
  ])

  return {
    slug: toProductSlug(item),
    name: item.name,
    sku: item.sku ?? item.id,
    price: item.price,
    availableQuantity: item.quantity,
    taxRate,
    status,
    category: "apparel",
    apparelType: item.apparel?.apparelType ?? "Accessory",
    material: item.apparel?.material ?? "Tactical Fabric",
    sizes: sizes.length > 0 ? sizes : [DEFAULT_APPAREL_SIZE],
    colorSwatches: toColorSwatches(item),
    variants,
    images: await resolveImageUrls(item.images, "/placeholder.svg"),
    description: item.description ?? "Product details coming soon.",
    requiresFFL: false,
  }
}

async function toProduct(item: InventoryItem): Promise<Product | null> {
  const status = toAvailabilityStatus(item)
  if (!status) {
    return null
  }

  const settings = await getStoreTaxSettings()
  const taxRate = resolveInventoryTaxRate(
    item.itemType,
    item.taxMode,
    item.customTaxRate,
    settings,
  )

  switch (item.itemType) {
    case "FIREARM":
      return toFirearmProduct(item, status, taxRate)
    case "APPAREL":
      return toApparelProduct(item, status, taxRate)
    case "PART":
    case "ACCESSORY":
    case "AMMUNITION":
      return toPartProduct(item, status, taxRate)
    default:
      return null
  }
}

export const getLiveCatalog = cache(async (): Promise<Product[]> => {
  if (process.env.E2E_TEST_MODE !== "1" && !isAmplifyDataConfigured) {
    return getAllProducts()
  }

  const items = await listPublicInventory()
  const products = await Promise.all(items.map(toProduct))
  return products.filter((product): product is Product => Boolean(product))
})

export async function getLiveProductsByCategory<C extends ProductCategory>(
  category: C,
): Promise<CategoryProductMap[C][]> {
  if (process.env.E2E_TEST_MODE !== "1" && !isAmplifyDataConfigured) {
    return getProductsByCategory(category) as CategoryProductMap[C][]
  }

  const products = await getLiveCatalog()
  return products.filter(
    (product): product is CategoryProductMap[C] => product.category === category,
  )
}

export async function getLiveProductBySlug<C extends ProductCategory>(
  slug: string,
  category?: C,
): Promise<CategoryProductMap[C] | Product | undefined> {
  if (process.env.E2E_TEST_MODE !== "1" && !isAmplifyDataConfigured) {
    return getProductBySlug(slug, category) as CategoryProductMap[C] | Product | undefined
  }

  const products = category
    ? await getLiveProductsByCategory(category)
    : await getLiveCatalog()

  return products.find((product) => product.slug === slug)
}

export async function getLiveFeaturedProducts() {
  if (process.env.E2E_TEST_MODE !== "1" && !isAmplifyDataConfigured) {
    return getFeaturedProducts()
  }

  const products = await getLiveCatalog()
  return products.slice(0, 4)
}
