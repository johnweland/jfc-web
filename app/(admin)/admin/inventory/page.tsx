import { InventoryAdminClient } from "@/components/inventory/inventory-admin-client"
import { listInventory } from "@/lib/inventory/data"
import { listAllInventoryUnits } from "@/lib/inventory/units/data"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const [items, units] = await Promise.all([listInventory(), listAllInventoryUnits()])
  const isE2eTestMode = process.env.E2E_TEST_MODE === "1"

  return (
    <InventoryAdminClient
      initialItems={items}
      initialUnits={units}
      isE2eTestMode={isE2eTestMode}
    />
  )
}
