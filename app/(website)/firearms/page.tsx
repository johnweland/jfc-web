import { FirearmsCatalog } from "@/components/catalog/firearms-catalog"
import { getLiveProductsByCategory } from "@/lib/catalog/live"
import type { Firearm } from "@/lib/data/types"

export const dynamic = "force-dynamic"

export default async function FirearmsPage() {
  const firearms = (await getLiveProductsByCategory("firearm")) as Firearm[]
  return <FirearmsCatalog firearms={firearms} />
}
