import "server-only"

import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"
import { cookies } from "next/headers"
import outputs from "@/amplify_outputs.json"
import type { Schema } from "@/amplify/data/resource"
import { getServerAuthState } from "@/lib/auth/server"
import type { InventoryItem } from "@/lib/types/inventory"
import { fromAmplifyRecord } from "./mapper"

const PUBLIC_INVENTORY_SELECTION = [
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
  "createdAt",
  "updatedAt",
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

export async function listInventory(): Promise<InventoryItem[]> {
  const client = getClient()
  const { data, errors } = await client.models.InventoryItem.list()
  if (errors?.length) console.error("[inventory/data] listInventory errors", errors)
  return (data ?? [])
    .map(fromAmplifyRecord)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const client = getClient()
  const { data, errors } = await client.models.InventoryItem.get({ id })
  if (errors?.length) console.error("[inventory/data] getInventoryItem errors", errors)
  return data ? fromAmplifyRecord(data) : null
}

export async function listPublicInventory(): Promise<InventoryItem[]> {
  const authState = await getServerAuthState()

  if (authState?.isSignedIn) {
    const client = getClient()
    const { data, errors } = await client.models.InventoryItem.list()
    if (errors?.length) console.error("[inventory/data] listPublicInventory userPool errors", errors)
    return (data ?? [])
      .map(fromAmplifyRecord)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  const client = getPublicClient()
  const { data, errors } = await client.models.InventoryItem.list({
    selectionSet: PUBLIC_INVENTORY_SELECTION,
  })
  if (errors?.length) console.error("[inventory/data] listPublicInventory apiKey errors", errors)
  return ((data ?? []) as Schema["InventoryItem"]["type"][])
    .map(fromAmplifyRecord)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
