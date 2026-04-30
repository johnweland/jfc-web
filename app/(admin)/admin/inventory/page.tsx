import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { listInventory } from "@/lib/inventory/data"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const items = await listInventory()

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
        </div>
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

      <InventoryTable data={items} />
    </div>
  )
}
