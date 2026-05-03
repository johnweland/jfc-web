import { InventoryAdminClient } from "@/components/inventory/inventory-admin-client"
import { listInventory } from "@/lib/inventory/data"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const items = await listInventory()
  const isE2eTestMode = process.env.E2E_TEST_MODE === "1"

  return <InventoryAdminClient initialItems={items} isE2eTestMode={isE2eTestMode} />
}
