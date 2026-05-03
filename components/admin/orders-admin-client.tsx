"use client"

import { useDeferredValue, useEffect, useEffectEvent, useMemo, useState } from "react"
import Link from "next/link"
import { generateClient } from "aws-amplify/data"
import { ExternalLink, PackageSearch, Search, ShieldCheck } from "lucide-react"

import type { Schema } from "@/amplify/data/resource"
import {
  AdminFulfillmentStatusBadge,
  AdminOrderStatusBadge,
  AdminPaymentStatusBadge,
} from "@/components/admin/admin-status-badges"
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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ADMIN_CUSTOMER_PROFILE_SELECTION,
  ADMIN_LIST_LIMIT,
  ADMIN_ORDER_SELECTION,
  buildAdminOrders,
  formatAddressLines,
  formatCurrency,
  formatDate,
  formatDateTime,
  humanizeEnum,
  type AdminOrder,
  type CustomerProfileRecord,
  type OrderRecord,
} from "@/lib/admin/shared"

const client = generateClient<Schema>()

type DateRangeFilter = "all" | "7d" | "30d" | "90d"
type ListResponse<T> = {
  data?: T[]
  errors?: readonly { message: string }[]
  nextToken?: string | null
}

async function listAllProfilesClientSide() {
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

async function refreshOrdersClientSide() {
  const [profiles, orders] = await Promise.all([
    listAllProfilesClientSide(),
    listAllOrdersClientSide(),
  ])

  return buildAdminOrders(orders, profiles)
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

function OrderDetailSheet({
  order,
  onOpenChange,
}: {
  order: AdminOrder | null
  onOpenChange: (open: boolean) => void
}) {
  const shippingLines = formatAddressLines(order?.shippingAddressSnapshot)
  const fflLines = formatAddressLines(order?.transferFflSnapshot?.address)

  return (
    <Sheet open={Boolean(order)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden border-border/40 bg-surface p-0 sm:max-w-3xl"
      >
        {order ? (
          <>
            <SheetHeader className="border-b border-border/30 bg-surface-container-low px-6 py-5">
              <SheetTitle className="font-display text-2xl font-bold uppercase tracking-[-0.03em]">
                {order.orderNumber}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <span>{order.customerName}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </SheetDescription>
              <div className="flex flex-wrap gap-2 pt-3">
                <AdminOrderStatusBadge status={order.status} />
                <AdminPaymentStatusBadge status={order.paymentStatus} />
                <AdminFulfillmentStatusBadge status={order.fulfillmentStatus} />
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="border-border/60 bg-surface-container-low lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Ordered Items
                    </CardTitle>
                    <CardDescription>{order.itemCount} unit(s) in this order</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {order.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No line items were stored.</p>
                    ) : (
                      order.items.map((item, index) => (
                        <div
                          key={`${order.id}-${item.inventoryItemId ?? item.sku ?? index}`}
                          className="flex flex-col gap-3 border border-border/40 bg-surface px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {humanizeEnum(item.itemType)}
                              {item.category ? ` • ${item.category}` : ""}
                              {item.sku ? ` • ${item.sku}` : ""}
                            </p>
                            {item.fflRequired ? (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                                <ShieldCheck className="size-3" />
                                FFL transfer required
                              </p>
                            ) : null}
                          </div>
                          <div className="grid shrink-0 grid-cols-3 gap-4 text-sm sm:text-right">
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground/60">Qty</p>
                              <p className="font-medium text-foreground">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground/60">
                                Unit
                              </p>
                              <p className="font-medium text-foreground">
                                {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground/60">
                                Total
                              </p>
                              <p className="font-medium text-foreground">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                  <Card className="border-border/60 bg-surface-container-low">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                        Customer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                      <p className="font-medium text-foreground">{order.customerName}</p>
                      <p className="text-muted-foreground">{order.customerEmail}</p>
                      <Button variant="outline" size="sm" className="w-full rounded-none" asChild>
                        <Link href={`/admin/customers?customer=${encodeURIComponent(order.customerId)}`}>
                          <ExternalLink data-icon="inline-end" />
                          View Customer
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 bg-surface-container-low">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                        Totals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(order.subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(order.tax)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(order.shipping)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fees</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(order.fees)}
                        </span>
                      </div>
                      <Separator className="bg-border/40" />
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">Order Total</span>
                        <span className="font-display text-lg font-bold text-foreground">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Fulfillment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Method</span>
                      <span className="text-right text-foreground">
                        {order.shippingMethod || "Unavailable"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Carrier</span>
                      <span className="text-right text-foreground">
                        {order.shippingCarrier || "Unavailable"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Tracking</span>
                      <span className="text-right font-mono text-foreground">
                        {order.trackingNumber || "Unavailable"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Firearm Items</span>
                      <span className="text-right text-foreground">
                        {order.containsFirearm ? "Yes" : "No"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1 text-sm text-foreground">
                    {shippingLines.length > 0 ? (
                      shippingLines.map((line) => <p key={line}>{line}</p>)
                    ) : (
                      <p className="text-muted-foreground">No shipping address stored.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Transfer FFL
                    </CardTitle>
                    <CardDescription>
                      Shown when the order includes serialized items routed through an FFL.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    {order.transferFflSnapshot ? (
                      <>
                        <p className="font-medium text-foreground">
                          {order.transferFflSnapshot.fflName}
                        </p>
                        {order.transferFflSnapshot.fflNumber ? (
                          <p className="font-mono text-xs text-primary">
                            {order.transferFflSnapshot.fflNumber}
                          </p>
                        ) : null}
                        {fflLines.map((line) => (
                          <p key={line} className="text-foreground">
                            {line}
                          </p>
                        ))}
                        {order.transferFflSnapshot.contactName ? (
                          <p className="text-muted-foreground">
                            Contact: {order.transferFflSnapshot.contactName}
                          </p>
                        ) : null}
                        {order.transferFflSnapshot.phone ? (
                          <p className="text-muted-foreground">{order.transferFflSnapshot.phone}</p>
                        ) : null}
                        {order.transferFflSnapshot.email ? (
                          <p className="text-muted-foreground">{order.transferFflSnapshot.email}</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-muted-foreground">No FFL destination stored.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Admin Notes
                    </CardTitle>
                    <CardDescription>
                      The current order model does not yet include dedicated internal admin notes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                    <p>No internal notes are stored for this order today.</p>
                    <p>
                      TODO: wire status editing and internal notes here once the admin mutation
                      workflow is defined for orders.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function OrdersAdminClient({
  initialOrders,
  initialSelectedOrderId,
  initialError = null,
}: {
  initialOrders: AdminOrder[]
  initialSelectedOrderId?: string
  initialError?: string | null
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [loadError, setLoadError] = useState<string | null>(initialError)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialSelectedOrderId ?? null,
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("all")
  const [nowTimestamp] = useState(() => Date.now())

  const deferredSearchQuery = useDeferredValue(searchQuery)

  async function refreshOrders() {
    setIsRefreshing(true)

    try {
      const nextOrders = await refreshOrdersClientSide()
      setOrders(nextOrders)
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load orders.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleInitialRefresh = useEffectEvent(() => {
    void refreshOrders()
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      handleInitialRefresh()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const filteredOrders = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()

    return orders.filter((order) => {
      if (normalizedQuery) {
        const haystack = [
          order.orderNumber,
          order.id,
          order.customerName,
          order.customerEmail,
        ]
          .join(" ")
          .toLowerCase()

        if (!haystack.includes(normalizedQuery)) {
          return false
        }
      }

      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false
      }

      if (paymentFilter !== "all" && order.paymentStatus !== paymentFilter) {
        return false
      }

      if (fulfillmentFilter !== "all" && order.fulfillmentStatus !== fulfillmentFilter) {
        return false
      }

      if (dateRangeFilter !== "all") {
        const orderTime = new Date(order.createdAt).getTime()

        if (Number.isNaN(orderTime)) {
          return false
        }

        const maxAge =
          dateRangeFilter === "7d"
            ? 7
            : dateRangeFilter === "30d"
              ? 30
              : 90

        if (orderTime < nowTimestamp - maxAge * 24 * 60 * 60 * 1000) {
          return false
        }
      }

      return true
    })
  }, [
    dateRangeFilter,
    deferredSearchQuery,
    fulfillmentFilter,
    nowTimestamp,
    orders,
    paymentFilter,
    statusFilter,
  ])

  const selectedOrder = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId || order.orderNumber === selectedOrderId) ?? null
    : null

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
  const firearmOrders = filteredOrders.filter((order) => order.containsFirearm).length
  const awaitingAction = filteredOrders.filter(
    (order) =>
      order.status === "PENDING" ||
      order.status === "AWAITING_PAYMENT" ||
      order.fulfillmentStatus === "UNFULFILLED",
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p
            className="mb-1 text-[10px] font-semibold uppercase text-primary"
            style={{ letterSpacing: "0.2em" }}
          >
            ADMIN / ORDERS
          </p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[-0.03em] text-foreground">
            ORDERS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Descending order queue with customer, payment, and fulfillment visibility.
          </p>
          {loadError ? <p className="mt-2 text-xs text-destructive">{loadError}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-none uppercase text-xs font-semibold"
            style={{ letterSpacing: "0.1em" }}
            onClick={() => void refreshOrders()}
            disabled={isRefreshing}
          >
            <PackageSearch data-icon="inline-start" />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Visible Orders"
          value={String(filteredOrders.length).padStart(2, "0")}
          helper="Newest orders appear first."
        />
        <StatCard
          label="Visible Revenue"
          value={formatCurrency(totalRevenue)}
          helper="Sum of the filtered order totals."
        />
        <StatCard
          label="Firearm Orders"
          value={String(firearmOrders).padStart(2, "0")}
          helper={`${awaitingAction} orders still need follow-up or fulfillment movement.`}
        />
      </div>

      <Card className="border-border/60 bg-surface-container-low">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
            Filters
          </CardTitle>
          <CardDescription>Search by order id, customer, or status signals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search order number, id, customer, or email"
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Order status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All order statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="AWAITING_PAYMENT">Awaiting payment</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="READY_FOR_TRANSFER">Ready for transfer</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All payment states</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="AUTHORIZED">Authorized</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially refunded</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Fulfillment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All fulfillment states</SelectItem>
                  <SelectItem value="UNFULFILLED">Unfulfilled</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="READY_FOR_PICKUP">Ready for pickup</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={dateRangeFilter}
              onValueChange={(value) => setDateRangeFilter(value as DateRangeFilter)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card className="border-border/60 bg-surface-container-low">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <PackageSearch className="size-8 text-muted-foreground/25" />
            <p className="font-display text-lg font-semibold uppercase text-foreground">
              No Orders Found
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Adjust the current filters or refresh the dataset to load the latest order queue.
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
                    <TableHead className="px-4">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Tracking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="flex flex-col text-left"
                        >
                          <span className="font-medium text-foreground">{order.orderNumber}</span>
                          <span className="text-xs text-muted-foreground">{order.id}</span>
                        </button>
                      </TableCell>
                      <TableCell className="py-3">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="flex flex-col text-left"
                        >
                          <span className="font-medium text-foreground">{order.customerName}</span>
                          <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                        </button>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="py-3">
                        <AdminOrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="py-3">
                        <AdminPaymentStatusBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell className="py-3">
                        <AdminFulfillmentStatusBadge status={order.fulfillmentStatus} />
                      </TableCell>
                      <TableCell className="py-3 text-sm text-foreground">
                        {order.itemCount}
                        {order.containsFirearm ? (
                          <span className="ml-2 text-xs text-primary">FFL</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-3 font-medium text-foreground">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {order.trackingNumber || "Unavailable"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:hidden">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-border/60 bg-surface-container-low">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {order.orderNumber}
                      </CardTitle>
                      <CardDescription>{formatDateTime(order.createdAt)}</CardDescription>
                    </div>
                    {order.containsFirearm ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <ShieldCheck className="size-3" />
                        FFL
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminOrderStatusBadge status={order.status} />
                    <AdminPaymentStatusBadge status={order.paymentStatus} />
                    <AdminFulfillmentStatusBadge status={order.fulfillmentStatus} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground/60">Customer</p>
                      <p className="font-medium text-foreground">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground/60">Tracking</p>
                      <p className="font-mono text-sm text-foreground">
                        {order.trackingNumber || "Unavailable"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {order.itemCount} item(s)
                    </div>
                    <div className="font-display text-lg font-bold text-foreground">
                      {formatCurrency(order.total)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-none uppercase text-xs font-semibold"
                    style={{ letterSpacing: "0.1em" }}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <OrderDetailSheet
        order={selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  )
}
