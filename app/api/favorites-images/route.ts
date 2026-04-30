import type { NextRequest } from "next/server"
import { getLiveCatalog } from "@/lib/catalog/live"

export async function GET(request: NextRequest) {
  const rawSlugParam = request.nextUrl.searchParams.get("slug") ?? ""
  const slugs = rawSlugParam
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)

  if (slugs.length === 0) {
    return Response.json(
      { imageUrls: {} },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  }

  const slugSet = new Set(slugs)
  const products = await getLiveCatalog()

  const imageUrls = Object.fromEntries(
    products
      .filter((product) => slugSet.has(product.slug))
      .map((product) => [product.slug, product.images[0] ?? null]),
  )

  return Response.json(
    { imageUrls },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
