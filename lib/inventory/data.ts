import "server-only"

import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"
import { cookies } from "next/headers"
import outputs from "@/amplify_outputs.json"
import type { Schema } from "@/amplify/data/resource"
import { getServerAuthState } from "@/lib/auth/server"
import type { InventoryItem } from "@/lib/types/inventory"
import { refreshInventoryImages } from "./image-urls"
import { fromAmplifyRecord } from "./mapper"

const LEGACY_INVENTORY_SELECTION = [
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

const TAX_INVENTORY_SELECTION = [
  ...LEGACY_INVENTORY_SELECTION,
  "taxMode",
  "customTaxRate",
] as const

function getClient() {
  return generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies,
    authMode: "userPool",
  })
}

function getPublicClient() {
  return generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies,
    authMode: "apiKey",
  })
}

function hasTaxSchemaReadError(errors: readonly { message: string }[] | undefined) {
  return Boolean(
    errors?.some(
      (error) =>
        error.message.includes("taxMode") ||
        error.message.includes("customTaxRate"),
    ),
  )
}

async function mapInventoryRecords(records: Schema["InventoryItem"]["type"][]) {
  const mapped = await Promise.all(
    records.map(async (record) => {
      const item = fromAmplifyRecord(record)
      return {
        ...item,
        images: await refreshInventoryImages(item.images),
      }
    }),
  )

  return mapped.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function listInventory(): Promise<InventoryItem[]> {
  const client = getClient()
  const primary = await client.models.InventoryItem.list({
    selectionSet: TAX_INVENTORY_SELECTION,
  })

  if (!hasTaxSchemaReadError(primary.errors)) {
    if (primary.errors?.length) {
      console.error("[inventory/data] listInventory errors", primary.errors)
    }
    return mapInventoryRecords((primary.data ?? []) as Schema["InventoryItem"]["type"][])
  }

  const legacy = await client.models.InventoryItem.list({
    selectionSet: LEGACY_INVENTORY_SELECTION,
  })

  if (legacy.errors?.length) {
    console.error("[inventory/data] listInventory legacy fallback errors", legacy.errors)
  }

  return mapInventoryRecords((legacy.data ?? []) as Schema["InventoryItem"]["type"][])
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const client = getClient()
  const primary = await client.models.InventoryItem.get({
    id,
  }, {
    selectionSet: TAX_INVENTORY_SELECTION,
  })

  if (!hasTaxSchemaReadError(primary.errors)) {
    if (primary.errors?.length) {
      console.error("[inventory/data] getInventoryItem errors", primary.errors)
    }
    if (!primary.data) {
      return null
    }

    const item = fromAmplifyRecord(primary.data as Schema["InventoryItem"]["type"])
    return {
      ...item,
      images: await refreshInventoryImages(item.images),
    }
  }

  const legacy = await client.models.InventoryItem.get({
    id,
  }, {
    selectionSet: LEGACY_INVENTORY_SELECTION,
  })

  if (legacy.errors?.length) {
    console.error("[inventory/data] getInventoryItem legacy fallback errors", legacy.errors)
  }

  if (!legacy.data) {
    return null
  }

  const item = fromAmplifyRecord(legacy.data as Schema["InventoryItem"]["type"])
  return {
    ...item,
    images: await refreshInventoryImages(item.images),
  }
}

export async function listPublicInventory(): Promise<InventoryItem[]> {
  const authState = await getServerAuthState()

  if (authState?.isSignedIn) {
    const client = getClient()
    const primary = await client.models.InventoryItem.list({
      selectionSet: TAX_INVENTORY_SELECTION,
    })

    if (!hasTaxSchemaReadError(primary.errors)) {
      if (primary.errors?.length) {
        console.error("[inventory/data] listPublicInventory userPool errors", primary.errors)
      }
      return mapInventoryRecords((primary.data ?? []) as Schema["InventoryItem"]["type"][])
    }

    const legacy = await client.models.InventoryItem.list({
      selectionSet: LEGACY_INVENTORY_SELECTION,
    })

    if (legacy.errors?.length) {
      console.error("[inventory/data] listPublicInventory userPool legacy fallback errors", legacy.errors)
    }

    return mapInventoryRecords((legacy.data ?? []) as Schema["InventoryItem"]["type"][])
  }

  const client = getPublicClient()
  const primary = await client.models.InventoryItem.list({
    selectionSet: TAX_INVENTORY_SELECTION,
  })

  if (!hasTaxSchemaReadError(primary.errors)) {
    if (primary.errors?.length) {
      console.error("[inventory/data] listPublicInventory apiKey errors", primary.errors)
    }
    return mapInventoryRecords((primary.data ?? []) as Schema["InventoryItem"]["type"][])
  }

  const legacy = await client.models.InventoryItem.list({
    selectionSet: LEGACY_INVENTORY_SELECTION,
  })

  if (legacy.errors?.length) {
    console.error("[inventory/data] listPublicInventory apiKey legacy fallback errors", legacy.errors)
  }

  return mapInventoryRecords((legacy.data ?? []) as Schema["InventoryItem"]["type"][])
}
