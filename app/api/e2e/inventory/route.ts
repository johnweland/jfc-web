import { NextResponse } from "next/server"

import {
  importE2eInventoryItems,
  listE2eInventoryItems,
  resetE2eInventoryItems,
  setE2eInventoryItems,
} from "@/lib/inventory/e2e-store"
import type { DuplicateInventoryBehavior } from "@/lib/inventory/csv/types"
import type { InventoryItem } from "@/lib/types/inventory"

export const dynamic = "force-dynamic"

function isEnabled() {
  return process.env.E2E_TEST_MODE === "1"
}

export async function GET() {
  if (!isEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ items: listE2eInventoryItems() })
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()

  switch (body.action) {
    case "reset":
      resetE2eInventoryItems()
      return NextResponse.json({ ok: true, items: [] })
    case "set":
      setE2eInventoryItems((body.items ?? []) as InventoryItem[])
      return NextResponse.json({ ok: true, items: listE2eInventoryItems() })
    case "import":
      return NextResponse.json(
        importE2eInventoryItems(
          (body.items ?? []) as InventoryItem[],
          (body.duplicateBehavior ?? "skip-existing") as DuplicateInventoryBehavior,
        ),
      )
    default:
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
  }
}
