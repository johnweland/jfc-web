import { PartsCatalog } from "@/components/catalog/parts-catalog"
import { getLiveProductsByCategory } from "@/lib/catalog/live"
import type { Part } from "@/lib/data/types"

export const dynamic = "force-dynamic"

export default async function PartsPage() {
  const parts = (await getLiveProductsByCategory("part")) as Part[]
  return <PartsCatalog parts={parts} />
}
