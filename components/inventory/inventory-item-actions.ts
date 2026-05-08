"use server"

import { cookies } from "next/headers"
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"

import type { Schema } from "@/amplify/data/resource"
import { amplifyOutputs } from "@/lib/auth/amplify-server"
import {
  deleteE2eInventoryUnit,
  listE2eInventoryItems,
  listE2eInventoryUnits,
  setE2eInventoryItems,
} from "@/lib/inventory/e2e-store"
import { listInventoryUnits } from "@/lib/inventory/units/data"

function getClient() {
  return generateServerClientUsingCookies<Schema>({
    config: amplifyOutputs,
    cookies,
    authMode: "userPool",
  })
}

function isE2e() {
  return process.env.E2E_TEST_MODE === "1"
}

export async function archiveInventoryItemAction(id: string) {
  if (isE2e()) {
    const items = listE2eInventoryItems()
    setE2eInventoryItems(
      items.map((item) =>
        item.id === id
          ? { ...item, status: "ARCHIVED", updatedAt: new Date().toISOString() }
          : item,
      ),
    )
    return
  }

  const client = getClient()
  const response = await client.models.InventoryItem.update({
    id,
    status: "ARCHIVED",
  })

  if (response.errors?.length) {
    throw new Error(response.errors.map((error) => error.message).join("; "))
  }
}

export async function deleteInventoryItemAction(id: string) {
  if (isE2e()) {
    setE2eInventoryItems(listE2eInventoryItems().filter((item) => item.id !== id))

    for (const unit of listE2eInventoryUnits().filter((unit) => unit.inventoryItemId === id)) {
      deleteE2eInventoryUnit(unit.id)
    }

    return
  }

  const client = getClient()
  const units = await listInventoryUnits(id)

  for (const unit of units) {
    const unitResponse = await client.models.InventoryUnit.delete({ id: unit.id })
    if (unitResponse.errors?.length) {
      throw new Error(unitResponse.errors.map((error) => error.message).join("; "))
    }
  }

  const response = await client.models.InventoryItem.delete({ id })
  if (response.errors?.length) {
    throw new Error(response.errors.map((error) => error.message).join("; "))
  }
}
