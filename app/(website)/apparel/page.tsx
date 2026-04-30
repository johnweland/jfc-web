import { ApparelCatalog } from "@/components/catalog/apparel-catalog"
import { getLiveProductsByCategory } from "@/lib/catalog/live"
import type { Apparel } from "@/lib/data/types"

export const dynamic = "force-dynamic"

export default async function ApparelPage() {
  const apparel = (await getLiveProductsByCategory("apparel")) as Apparel[]
  return <ApparelCatalog apparel={apparel} />
}
