"use client"

import { useEffect, useEffectEvent, useState } from "react"
import Link from "next/link"
import { generateClient } from "aws-amplify/data"
import { Plus } from "lucide-react"

import type { Schema } from "@/amplify/data/resource"
import { InventoryCsvActions } from "@/components/inventory/inventory-csv-actions"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { Button } from "@/components/ui/button"
import { fromAmplifyRecord } from "@/lib/inventory/mapper"
import type { InventoryItem } from "@/lib/types/inventory"

const client = generateClient<Schema>()
const INVENTORY_LIST_LIMIT = 1000
const ADMIN_INVENTORY_SELECTION = [
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
  "taxMode",
  "customTaxRate",
  "cost",
  "serialNumber",
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
  "location",
  "sourceId",
  "importBatchId",
  "sourceSystem",
  "images",
  "createdAt",
  "updatedAt",
] as const

async function listAllInventoryItemsClientSide(isE2eTestMode: boolean) {
  if (isE2eTestMode) {
    const response = await fetch("/api/e2e/inventory", {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Unable to load e2e inventory items.")
    }

    const payload = (await response.json()) as { items: InventoryItem[] }
    return payload.items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  const records: Schema["InventoryItem"]["type"][] = []
  let nextToken: string | null | undefined = undefined

  do {
    const response: {
      data?: Schema["InventoryItem"]["type"][]
      errors?: readonly { message: string }[]
      nextToken?: string | null
    } = await client.models.InventoryItem.list({
      limit: INVENTORY_LIST_LIMIT,
      nextToken,
      selectionSet: ADMIN_INVENTORY_SELECTION,
    })

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(" "))
    }

    records.push(...((response.data ?? []) as Schema["InventoryItem"]["type"][]))
    nextToken = response.nextToken
  } while (nextToken)

  return records
    .map((record) => fromAmplifyRecord(record))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function InventoryAdminClient({
  initialItems,
  isE2eTestMode = false,
}: {
  initialItems: InventoryItem[]
  isE2eTestMode?: boolean
}) {
  const [items, setItems] = useState(initialItems)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function refreshItems() {
    try {
      const nextItems = await listAllInventoryItemsClientSide(isE2eTestMode)
      setItems(nextItems)
      setLoadError(null)
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load inventory items.",
      )
    }
  }

  const handleInitialRefresh = useEffectEvent(() => {
    void refreshItems()
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      handleInitialRefresh()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[10px] font-semibold uppercase text-primary mb-1"
            style={{ letterSpacing: "0.2em" }}
          >
            ADMIN / INVENTORY
          </p>
          <h1
            className="font-display text-3xl font-bold uppercase text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            INVENTORY
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} items total
          </p>
          {loadError ? (
            <p className="mt-1 text-xs text-destructive">{loadError}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <InventoryCsvActions
            items={items}
            onInventoryChanged={refreshItems}
            isE2eTestMode={isE2eTestMode}
          />
          <Button
            className="gradient-primary text-primary-foreground font-semibold uppercase text-xs shrink-0"
            style={{ letterSpacing: "0.1em" }}
            asChild
          >
            <Link href="/admin/inventory/new">
              <Plus className="size-3.5" />
              NEW ITEM
            </Link>
          </Button>
        </div>
      </div>

      <InventoryTable data={items} />
    </div>
  )
}
