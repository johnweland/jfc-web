"use client"

import { useDeferredValue, useEffect, useEffectEvent, useMemo, useState } from "react"
import Link from "next/link"
import { generateClient } from "aws-amplify/data"
import { ExternalLink, RefreshCcw, Search, ShieldCheck, Users } from "lucide-react"

import type { Schema } from "@/amplify/data/resource"
import { AdminOrderStatusBadge } from "@/components/admin/admin-status-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ADMIN_CUSTOMER_ADDRESS_SELECTION,
  ADMIN_CUSTOMER_FFL_SELECTION,
  ADMIN_CUSTOMER_PROFILE_SELECTION,
  ADMIN_LIST_LIMIT,
  ADMIN_ORDER_SELECTION,
  buildAdminCustomers,
  formatAddressLines,
  formatCurrency,
  formatDate,
  formatDateTime,
  type AdminCustomer,
  type CustomerAddressRecord,
  type CustomerFflLocationRecord,
  type CustomerProfileRecord,
  type OrderRecord,
} from "@/lib/admin/shared"

const client = generateClient<Schema>()

type OrderPresenceFilter = "all" | "with-orders" | "no-orders"
type ListResponse<T> = {
  data?: T[]
  errors?: readonly { message: string }[]
  nextToken?: string | null
}

async function listAllCustomerProfilesClientSide() {
  const records: CustomerProfileRecord[] = []
  let nextToken: string | null | undefined = undefined

  do {
    const response = (await client.models.CustomerProfile.list({
      limit: ADMIN_LIST_LIMIT,
      nextToken,
      selectionSet: ADMIN_CUSTOMER_PROFILE_SELECTION,
    })) as unknown as ListResponse<CustomerProfileRecord>

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(" "))
    }

    records.push(...((response.data ?? []) as CustomerProfileRecord[]))
    nextToken = response.nextToken
  } while (nextToken)

  return records
}

async function listAllCustomerAddressesClientSide() {
  const records: CustomerAddressRecord[] = []
  let nextToken: string | null | undefined = undefined

  do {
    const response = (await client.models.CustomerAddress.list({
      limit: ADMIN_LIST_LIMIT,
      nextToken,
      selectionSet: ADMIN_CUSTOMER_ADDRESS_SELECTION,
    })) as unknown as ListResponse<CustomerAddressRecord>

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(" "))
    }

    records.push(...((response.data ?? []) as CustomerAddressRecord[]))
    nextToken = response.nextToken
  } while (nextToken)

  return records
}

async function listAllCustomerFflsClientSide() {
  const records: CustomerFflLocationRecord[] = []
  let nextToken: string | null | undefined = undefined

  do {
    const response = (await client.models.CustomerFflLocation.list({
      limit: ADMIN_LIST_LIMIT,
      nextToken,
      selectionSet: ADMIN_CUSTOMER_FFL_SELECTION,
    })) as unknown as ListResponse<CustomerFflLocationRecord>

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(" "))
    }

    records.push(...((response.data ?? []) as CustomerFflLocationRecord[]))
    nextToken = response.nextToken
  } while (nextToken)

  return records
}

async function listAllOrdersClientSide() {
  const records: OrderRecord[] = []
  let nextToken: string | null | undefined = undefined

  do {
    const response = (await client.models.Order.list({
      limit: ADMIN_LIST_LIMIT,
      nextToken,
      selectionSet: ADMIN_ORDER_SELECTION,
    })) as unknown as ListResponse<OrderRecord>

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(" "))
    }

    records.push(...((response.data ?? []) as OrderRecord[]))
    nextToken = response.nextToken
  } while (nextToken)

  return records
}

async function refreshCustomersClientSide() {
  const [profiles, addresses, fflLocations, orders] = await Promise.all([
    listAllCustomerProfilesClientSide(),
    listAllCustomerAddressesClientSide(),
    listAllCustomerFflsClientSide(),
    listAllOrdersClientSide(),
  ])

  return buildAdminCustomers(profiles, addresses, fflLocations, orders)
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <Card className="border-border/60 bg-surface-container-low">
      <CardHeader className="gap-1 pb-2">
        <CardDescription
          className="text-[10px] font-semibold uppercase text-muted-foreground/70"
          style={{ letterSpacing: "0.14em" }}
        >
          {label}
        </CardDescription>
        <CardTitle className="font-display text-2xl font-bold uppercase text-foreground">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function DetailAddressCard({
  title,
  lines,
  detail,
  isDefault = false,
}: {
  title: string
  lines: string[]
  detail?: string | null
  isDefault?: boolean
}) {
  return (
    <div className="border border-border/40 bg-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{title}</p>
          {lines.map((line) => (
            <p key={line} className="text-sm text-muted-foreground">
              {line}
            </p>
          ))}
          {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
        </div>
        {isDefault ? (
          <span className="text-[10px] font-semibold uppercase text-primary">Default</span>
        ) : null}
      </div>
    </div>
  )
}

function CustomerDetailSheet({
  customer,
  onOpenChange,
}: {
  customer: AdminCustomer | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={Boolean(customer)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden border-border/40 bg-surface p-0 sm:max-w-4xl xl:max-w-[66vw]"
      >
        {customer ? (
          <>
            <SheetHeader className="border-b border-border/30 bg-surface-container-low px-6 py-5">
              <SheetTitle className="font-display text-2xl font-bold uppercase tracking-[-0.03em]">
                {customer.fullName}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <span>{customer.email}</span>
                {customer.phone ? (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{customer.phone}</span>
                  </>
                ) : null}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Customer ID</span>
                      <span className="max-w-[14rem] break-all text-right font-mono text-foreground">
                        {customer.customerId}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Orders</span>
                      <span className="text-right text-foreground">{customer.orderCount}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Total Spend</span>
                      <span className="text-right font-medium text-foreground">
                        {formatCurrency(customer.totalSpend)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-right text-foreground">
                        {formatDateTime(customer.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Last Order</span>
                      <span className="text-right text-foreground">
                        {formatDateTime(customer.mostRecentOrderDate)}
                      </span>
                    </div>
                  </CardContent>
              </Card>

              <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Order History
                    </CardTitle>
                    <CardDescription>
                      Links route into the dedicated admin orders workspace.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {customer.orders.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        This customer does not have any orders yet.
                      </p>
                    ) : (
                      customer.orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex flex-col gap-3 border border-border/40 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(order.createdAt)} • {order.itemCount} item(s)
                            </p>
                          </div>
                          <div className="flex flex-col gap-3 sm:items-end">
                            <div className="flex flex-wrap gap-2">
                              <AdminOrderStatusBadge status={order.status} />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-foreground">
                                {formatCurrency(order.total)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-none"
                                asChild
                              >
                                <Link href={`/admin/orders?order=${encodeURIComponent(order.id)}`}>
                                  <ExternalLink data-icon="inline-end" />
                                  View Order
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
              </Card>

              <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Saved Shipping Addresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {customer.addresses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No saved shipping addresses.</p>
                    ) : (
                      customer.addresses.map((address) => (
                        <DetailAddressCard
                          key={address.id}
                          title={address.recipientName || address.label || "Saved address"}
                          lines={formatAddressLines(address)}
                          detail={address.phone}
                          isDefault={address.id === customer.defaultShippingAddressId}
                        />
                      ))
                    )}
                  </CardContent>
              </Card>

              <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Saved FFL Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {customer.fflLocations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No saved FFL destinations.</p>
                    ) : (
                      customer.fflLocations.map((location) => (
                        <DetailAddressCard
                          key={location.id}
                          title={location.fflName}
                          lines={formatAddressLines(location.address)}
                          detail={
                            [
                              location.fflNumber ? `FFL ${location.fflNumber}` : null,
                              location.contactName ? `Contact: ${location.contactName}` : null,
                              location.phone,
                              location.email,
                            ]
                              .filter(Boolean)
                              .join(" • ")
                          }
                          isDefault={location.id === customer.defaultFflLocationId}
                        />
                      ))
                    )}
                  </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function CustomersAdminClient({
  initialCustomers,
  initialSelectedCustomerId,
  initialError = null,
}: {
  initialCustomers: AdminCustomer[]
  initialSelectedCustomerId?: string
  initialError?: string | null
}) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [loadError, setLoadError] = useState<string | null>(initialError)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialSelectedCustomerId ?? null,
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [orderPresenceFilter, setOrderPresenceFilter] = useState<OrderPresenceFilter>("all")

  const deferredSearchQuery = useDeferredValue(searchQuery)

  async function refreshCustomers() {
    setIsRefreshing(true)

    try {
      const nextCustomers = await refreshCustomersClientSide()
      setCustomers(nextCustomers)
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load customers.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleInitialRefresh = useEffectEvent(() => {
    void refreshCustomers()
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      handleInitialRefresh()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()

    return customers.filter((customer) => {
      if (normalizedQuery) {
        const haystack = [
          customer.fullName,
          customer.email,
          customer.phone ?? "",
        ]
          .join(" ")
          .toLowerCase()

        if (!haystack.includes(normalizedQuery)) {
          return false
        }
      }

      if (orderPresenceFilter === "with-orders" && customer.orderCount === 0) {
        return false
      }

      if (orderPresenceFilter === "no-orders" && customer.orderCount > 0) {
        return false
      }

      return true
    })
  }, [customers, deferredSearchQuery, orderPresenceFilter])

  const selectedCustomer = selectedCustomerId
    ? customers.find((customer) => customer.customerId === selectedCustomerId) ?? null
    : null

  const activeBuyers = filteredCustomers.filter((customer) => customer.orderCount > 0).length
  const totalSpend = filteredCustomers.reduce((sum, customer) => sum + customer.totalSpend, 0)
  const customersWithFfls = filteredCustomers.filter((customer) => customer.fflLocations.length > 0).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p
            className="mb-1 text-[10px] font-semibold uppercase text-primary"
            style={{ letterSpacing: "0.2em" }}
          >
            ADMIN / CUSTOMERS
          </p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[-0.03em] text-foreground">
            CUSTOMERS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Account directory with saved destinations and linked order history.
          </p>
          {loadError ? <p className="mt-2 text-xs text-destructive">{loadError}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-none uppercase text-xs font-semibold"
            style={{ letterSpacing: "0.1em" }}
            onClick={() => void refreshCustomers()}
            disabled={isRefreshing}
          >
            <RefreshCcw data-icon="inline-start" />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Visible Customers"
          value={String(filteredCustomers.length).padStart(2, "0")}
          helper="Filtered to the current search criteria."
        />
        <StatCard
          label="Active Buyers"
          value={String(activeBuyers).padStart(2, "0")}
          helper="Customers with at least one stored order."
        />
        <StatCard
          label="Saved FFLs"
          value={String(customersWithFfls).padStart(2, "0")}
          helper={`${formatCurrency(totalSpend)} total spend across the filtered set.`}
        />
      </div>

      <Card className="border-border/60 bg-surface-container-low">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
            Filters
          </CardTitle>
          <CardDescription>Search customers by name, email, or phone.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search name, email, or phone"
              className="pl-9"
            />
          </div>
          <Select
            value={orderPresenceFilter}
            onValueChange={(value) => setOrderPresenceFilter(value as OrderPresenceFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Order presence" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All customers</SelectItem>
                <SelectItem value="with-orders">Customers with orders</SelectItem>
                <SelectItem value="no-orders">Customers with no orders</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filteredCustomers.length === 0 ? (
        <Card className="border-border/60 bg-surface-container-low">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="size-8 text-muted-foreground/25" />
            <p className="font-display text-lg font-semibold uppercase text-foreground">
              No Customers Found
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Broaden the current filters or refresh the dataset to pull the latest customer
              records.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden border-border/60 bg-surface-container-low lg:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-container-high/70 hover:bg-surface-container-high/70">
                    <TableHead className="px-4">Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Recent Order</TableHead>
                    <TableHead>Total Spend</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Saved Destinations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.customerId}>
                      <TableCell className="px-4 py-3">
                        <button
                          onClick={() => setSelectedCustomerId(customer.customerId)}
                          className="flex flex-col text-left"
                        >
                          <span className="font-medium text-foreground">{customer.fullName}</span>
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        </button>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {customer.phone || "Unavailable"}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-foreground">
                        {customer.orderCount}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {formatDate(customer.mostRecentOrderDate)}
                      </TableCell>
                      <TableCell className="py-3 font-medium text-foreground">
                        {formatCurrency(customer.totalSpend)}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-foreground">
                        {customer.addresses.length} ship / {customer.fflLocations.length} FFL
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:hidden">
            {filteredCustomers.map((customer) => (
              <Card key={customer.customerId} className="border-border/60 bg-surface-container-low">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {customer.fullName}
                      </CardTitle>
                      <CardDescription>{customer.email}</CardDescription>
                    </div>
                    {customer.fflLocations.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <ShieldCheck className="size-3" />
                        FFL
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground/60">Orders</p>
                      <p className="font-medium text-foreground">{customer.orderCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground/60">Spend</p>
                      <p className="font-medium text-foreground">
                        {formatCurrency(customer.totalSpend)}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>{customer.phone || "Phone unavailable"}</p>
                    <p>
                      {customer.addresses.length} shipping address(es) • {customer.fflLocations.length}{" "}
                      saved FFL location(s)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-none uppercase text-xs font-semibold"
                    style={{ letterSpacing: "0.1em" }}
                    onClick={() => setSelectedCustomerId(customer.customerId)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <CustomerDetailSheet
        customer={selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomerId(null)}
      />
    </div>
  )
}
