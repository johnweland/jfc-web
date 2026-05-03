import { OrdersAdminClient } from "@/components/admin/orders-admin-client"
import { loadAdminOrders } from "@/lib/admin/server"
import type { AdminOrder } from "@/lib/admin/shared"

export const dynamic = "force-dynamic"

interface OrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = await searchParams
  const selectedOrderParam = resolvedSearchParams.order
  const initialSelectedOrderId =
    typeof selectedOrderParam === "string" ? selectedOrderParam : undefined
  let orders: AdminOrder[] = []
  let initialError: string | null = null

  try {
    orders = await loadAdminOrders()
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Unable to load admin orders."
  }

  return (
    <OrdersAdminClient
      initialOrders={orders}
      initialSelectedOrderId={initialSelectedOrderId}
      initialError={initialError}
    />
  )
}
