import { NextResponse } from "next/server"

import { getServerAuthState } from "@/lib/auth/server"
import { isAdminUser } from "@/lib/auth/shared"
import { migrateInventoryUnits } from "@/lib/inventory/migrate-units"

export const dynamic = "force-dynamic"

export async function POST() {
  const auth = await getServerAuthState()

  if (!isAdminUser(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await migrateInventoryUnits()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Migration failed" },
      { status: 500 },
    )
  }
}
