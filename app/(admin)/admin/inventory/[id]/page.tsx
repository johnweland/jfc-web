import { notFound } from "next/navigation"

import { InventoryForm } from "@/components/inventory/inventory-form"
import { getInventoryItem } from "@/lib/inventory/data"
import { listInventoryUnits } from "@/lib/inventory/units/data"

export const dynamic = "force-dynamic"

export default async function EditInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await getInventoryItem(id)

  if (!item) notFound()

  // Pre-fetch units for serialized FIREARMs so the form can hydrate without a client-side round-trip.
  const units = item.itemType === "FIREARM" && item.isSerialized
    ? await listInventoryUnits(item.id)
    : []

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p
          className="text-[10px] font-semibold uppercase text-primary mb-1"
          style={{ letterSpacing: "0.2em" }}
        >
          ADMIN / INVENTORY / EDIT
        </p>
        <h1
          className="font-display text-3xl font-bold uppercase text-foreground"
          style={{ letterSpacing: "-0.03em" }}
        >
          EDIT ITEM
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{item.name}</p>
      </div>

      <InventoryForm initialData={item} initialUnits={units} />
    </div>
  )
}
