import { CustomersAdminClient } from "@/components/admin/customers-admin-client"
import { loadAdminCustomers } from "@/lib/admin/server"
import type { AdminCustomer } from "@/lib/admin/shared"

export const dynamic = "force-dynamic"

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const resolvedSearchParams = await searchParams
  const selectedCustomerParam = resolvedSearchParams.customer
  const initialSelectedCustomerId =
    typeof selectedCustomerParam === "string" ? selectedCustomerParam : undefined
  let customers: AdminCustomer[] = []
  let initialError: string | null = null

  try {
    customers = await loadAdminCustomers()
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Unable to load admin customers."
  }

  return (
    <CustomersAdminClient
      initialCustomers={customers}
      initialSelectedCustomerId={initialSelectedCustomerId}
      initialError={initialError}
    />
  )
}
