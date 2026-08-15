"use client"

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react"
import Link from "next/link"
import { generateClient } from "aws-amplify/data"
import {
  Archive,
  ExternalLink,
  MoreHorizontal,
  PackageSearch,
  PencilLine,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react"

import type { Schema } from "@/amplify/data/resource"
import {
  archiveOrderAdminAction,
  updateOrderAdminAction,
} from "@/lib/admin/order-actions"
import {
  AdminFulfillmentStatusBadge,
  AdminOrderStatusBadge,
  AdminPaymentStatusBadge,
} from "@/components/admin/admin-status-badges"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  getOrderTrackingSummary,
  humanizeEnum,
  type AdminFulfillmentStatus,
  type AdminOrder,
  type AdminOrderStatus,
  type CustomerProfileRecord,
  type OrderRecord,
} from "@/lib/admin/shared"

const client = generateClient<Schema>()

const ORDER_STATUS_OPTIONS: AdminOrderStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PROCESSING",
  "READY_FOR_TRANSFER",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
]

const FULFILLMENT_STATUS_OPTIONS: AdminFulfillmentStatus[] = [
  "UNFULFILLED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "TRANSFERRED",
  "COMPLETED",
  "CANCELLED",
]

type DateRangeFilter = "all" | "7d" | "30d" | "90d"
type ArchiveFilter = "active" | "archived" | "all"
type DetailActionState = "idle" | "saving" | "archiving" | "deleting"
type PageSizeOption = 5 | 10 | 25 | 50
type ListResponse<T> = {
  data?: T[]
  errors?: readonly { message: string }[]
  nextToken?: string | null
}

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [5, 10, 25, 50]

function PaginationControls({
  page,
  totalPages,
  pageSize,
  itemLabel,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  pageSize: PageSizeOption
  itemLabel: string
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col gap-3 border-t border-border/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value) as PageSizeOption)}
          >
            <SelectTrigger className="w-[88px]">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="min-w-20 text-center text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
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

function ShipmentDetails({
  shipment,
}: {
  shipment?: {
    shippingMethod?: string | null
    shippingCarrier?: string | null
    trackingNumber?: string | null
  } | null
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-muted-foreground">Method</span>
        <span className="text-right text-foreground">
          {shipment?.shippingMethod || "Unavailable"}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <span className="text-muted-foreground">Carrier</span>
        <span className="text-right text-foreground">
          {shipment?.shippingCarrier || "Unavailable"}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <span className="text-muted-foreground">Tracking</span>
        <span className="text-right font-mono text-foreground">
          {shipment?.trackingNumber || "Unavailable"}
        </span>
      </div>
    </div>
  )
}

function OrderActionsMenu({
  order,
  onEdit,
  onArchive,
  disabled = false,
}: {
  order: AdminOrder
  onEdit: (order: AdminOrder) => void
  onArchive: (order: AdminOrder) => void
  disabled?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-none"
          disabled={disabled}
          aria-label={`Open actions for ${order.orderNumber}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 min-w-44">
        <DropdownMenuItem onSelect={() => onEdit(order)}>
          <PencilLine />
          Edit Order
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onArchive(order)} disabled={Boolean(order.archivedAt)}>
          <Archive />
          Archive Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function OrderDetailSheet({
  order,
  onOpenChange,
  onRefreshOrders,
}: {
  order: AdminOrder | null
  onOpenChange: (open: boolean) => void
  onRefreshOrders: () => Promise<void>
}) {
  const shippingLines = formatAddressLines(order?.shippingAddressSnapshot)
  const fflLines = formatAddressLines(order?.transferFflSnapshot?.address)

  return (
    <Sheet open={Boolean(order)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden border-border/40 bg-surface p-0 data-[side=right]:w-full sm:data-[side=right]:w-[50vw] sm:data-[side=right]:max-w-none"
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
                {order.archivedAt ? <Badge variant="outline">Archived</Badge> : null}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-4">
                <Card className="border-border/60 bg-surface-container-low">
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

                <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Customer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <p className="font-medium text-foreground">{order.customerName}</p>
                    <p className="text-muted-foreground">{order.customerEmail}</p>
                    <Button variant="outline" size="sm" className="w-full rounded-none sm:w-auto" asChild>
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

                <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Payment
                    </CardTitle>
                    <CardDescription>
                      Payment status stays read-only here so it tracks the processor record.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <AdminPaymentStatusBadge status={order.paymentStatus} />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Provider</span>
                      <span className="text-right text-foreground">
                        {order.paymentProvider || "Unavailable"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="text-right font-mono text-foreground">
                        {order.paymentReference || "Unavailable"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Shipping Address
                    </CardTitle>
                    <CardDescription>
                      Direct-to-customer destination and shipment details for non-FFL items.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 text-sm text-foreground">
                      {shippingLines.length > 0 ? (
                        shippingLines.map((line) => <p key={line}>{line}</p>)
                      ) : (
                        <p className="text-muted-foreground">No shipping address stored.</p>
                      )}
                    </div>
                    <Separator className="bg-border/40" />
                    {order.containsNonFflItems ? (
                      <>
                        <div className="rounded-lg border border-border/40 bg-surface px-4 py-3 text-sm text-muted-foreground">
                          Add or update this tracking in <span className="font-medium text-foreground">Admin Controls</span> under <span className="font-medium text-foreground">Non-FFL / Customer Tracking</span>.
                        </div>
                        <ShipmentDetails shipment={order.customerShipment} />
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No direct-to-customer items in this order.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-surface-container-low">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
                      Transfer FFL
                    </CardTitle>
                    <CardDescription>
                      Receiving dealer destination and shipment details for serialized items.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {order.transferFflSnapshot ? (
                      <>
                        <div className="flex flex-col gap-2 text-sm">
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
                        </div>
                        <Separator className="bg-border/40" />
                      </>
                    ) : null}

                    {order.containsFirearm ? (
                      <ShipmentDetails shipment={order.fflShipment} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No FFL-routed items in this order.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <OrderAdminControls
                  key={`${order.id}:${order.updatedAt}:${order.archivedAt ?? "active"}`}
                  order={order}
                  onOpenChange={onOpenChange}
                  onRefreshOrders={onRefreshOrders}
                />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function OrderAdminControls({
  order,
  onOpenChange,
  onRefreshOrders,
}: {
  order: AdminOrder
  onOpenChange: (open: boolean) => void
  onRefreshOrders: () => Promise<void>
}) {
  const [status, setStatus] = useState<AdminOrderStatus>(order.status)
  const [fulfillmentStatus, setFulfillmentStatus] =
    useState<AdminFulfillmentStatus>(order.fulfillmentStatus)
  const [customerShippingMethod, setCustomerShippingMethod] = useState(
    order.customerShipment?.shippingMethod ?? "",
  )
  const [customerShippingCarrier, setCustomerShippingCarrier] = useState(
    order.customerShipment?.shippingCarrier ?? "",
  )
  const [customerTrackingNumber, setCustomerTrackingNumber] = useState(
    order.customerShipment?.trackingNumber ?? "",
  )
  const [fflShippingMethod, setFflShippingMethod] = useState(order.fflShipment?.shippingMethod ?? "")
  const [fflShippingCarrier, setFflShippingCarrier] = useState(
    order.fflShipment?.shippingCarrier ?? "",
  )
  const [fflTrackingNumber, setFflTrackingNumber] = useState(order.fflShipment?.trackingNumber ?? "")
  const [actionState, setActionState] = useState<DetailActionState>("idle")
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const isMutating = actionState !== "idle"
  const isArchived = Boolean(order.archivedAt)

  async function refreshAfterMutation(nextOpenState: boolean) {
    await onRefreshOrders()
    onOpenChange(nextOpenState)
  }

  function handleSave() {
    setActionState("saving")
    setActionError(null)
    setActionMessage(null)

    startTransition(() => {
      void (async () => {
        try {
          await updateOrderAdminAction({
            id: order.id,
            status,
            fulfillmentStatus,
            customerShipment: {
              shippingMethod: customerShippingMethod,
              shippingCarrier: customerShippingCarrier,
              trackingNumber: customerTrackingNumber,
            },
            fflShipment: {
              shippingMethod: fflShippingMethod,
              shippingCarrier: fflShippingCarrier,
              trackingNumber: fflTrackingNumber,
            },
          })
          setActionMessage("Order updates saved.")
          await refreshAfterMutation(true)
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Unable to update order.")
        } finally {
          setActionState("idle")
        }
      })()
    })
  }

  function handleArchive() {
    if (!window.confirm(`Archive ${order.orderNumber}? You can still view it later.`)) {
      return
    }

    setActionState("archiving")
    setActionError(null)
    setActionMessage(null)

    startTransition(() => {
      void (async () => {
        try {
          await archiveOrderAdminAction(order.id)
          setActionMessage("Order archived.")
          await refreshAfterMutation(true)
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Unable to archive order.")
        } finally {
          setActionState("idle")
        }
      })()
    })
  }

  return (
    <Card className="border-border/60 bg-surface-container-low">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
          Admin Controls
        </CardTitle>
        <CardDescription>
          Update statuses and assign shipping details to the destination they belong to.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isArchived ? (
          <div className="rounded-lg border border-border/50 bg-surface px-4 py-3 text-sm text-muted-foreground">
            Archived on {formatDateTime(order.archivedAt)}. Archived orders stay visible for
            history and can be filtered out from the active queue.
          </div>
        ) : null}

        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
        {actionMessage ? <p className="text-sm text-primary">{actionMessage}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground/70">
              Order Status
            </p>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as AdminOrderStatus)}
              disabled={isMutating || isArchived}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Order status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {humanizeEnum(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground/70">
              Fulfillment Status
            </p>
            <Select
              value={fulfillmentStatus}
              onValueChange={(value) => setFulfillmentStatus(value as AdminFulfillmentStatus)}
              disabled={isMutating || isArchived}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Fulfillment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {humanizeEnum(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {order.containsNonFflItems ? (
          <div className="space-y-3 rounded-lg border border-border/40 bg-surface px-4 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase text-primary">Non-FFL / Customer Tracking</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter tracking for the items shipping directly to the customer address.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground/70">
                Shipping Method
              </p>
              <Input
                value={customerShippingMethod}
                onChange={(event) => setCustomerShippingMethod(event.target.value)}
                placeholder="UPS Ground, USPS Priority"
                disabled={isMutating || isArchived}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground/70">
                  Carrier
                </p>
                <Input
                  value={customerShippingCarrier}
                  onChange={(event) => setCustomerShippingCarrier(event.target.value)}
                  placeholder="UPS, USPS, FedEx"
                  disabled={isMutating || isArchived}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground/70">
                  Tracking Number
                </p>
                <Input
                  value={customerTrackingNumber}
                  onChange={(event) => setCustomerTrackingNumber(event.target.value)}
                  placeholder="1Z999..."
                  disabled={isMutating || isArchived}
                />
              </div>
            </div>
          </div>
        ) : null}

        {order.containsFirearm ? (
          <div className="space-y-3 rounded-lg border border-border/40 bg-surface px-4 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase text-primary">Transfer FFL Shipment</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Shipping details for the serialized items going to the receiving dealer.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground/70">
                Shipping Method
              </p>
              <Input
                value={fflShippingMethod}
                onChange={(event) => setFflShippingMethod(event.target.value)}
                placeholder="Dealer transfer, UPS Next Day"
                disabled={isMutating || isArchived}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground/70">
                  Carrier
                </p>
                <Input
                  value={fflShippingCarrier}
                  onChange={(event) => setFflShippingCarrier(event.target.value)}
                  placeholder="UPS, USPS, FedEx"
                  disabled={isMutating || isArchived}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground/70">
                  Tracking Number
                </p>
                <Input
                  value={fflTrackingNumber}
                  onChange={(event) => setFflTrackingNumber(event.target.value)}
                  placeholder="1Z999..."
                  disabled={isMutating || isArchived}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button
            className="rounded-none uppercase text-xs font-semibold"
            style={{ letterSpacing: "0.1em" }}
            onClick={handleSave}
            disabled={isMutating || isArchived}
          >
            <Save data-icon="inline-start" />
            {actionState === "saving" ? "Saving" : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            className="rounded-none uppercase text-xs font-semibold"
            style={{ letterSpacing: "0.1em" }}
            onClick={handleArchive}
            disabled={isMutating || isArchived}
          >
            <Archive data-icon="inline-start" />
            {actionState === "archiving" ? "Archiving" : "Archive"}
          </Button>
        </div>
      </CardContent>
    </Card>
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
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("active")
  const [activeOrderActionId, setActiveOrderActionId] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<PageSizeOption>(10)
  const [page, setPage] = useState(1)
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

  async function handleArchiveFromMenu(order: AdminOrder) {
    if (order.archivedAt) {
      return
    }

    if (!window.confirm(`Archive ${order.orderNumber}? You can still view it later.`)) {
      return
    }

    setActiveOrderActionId(order.id)

    try {
      await archiveOrderAdminAction(order.id)
      await refreshOrders()
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to archive order.")
    } finally {
      setActiveOrderActionId(null)
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
        const haystack = [order.orderNumber, order.id, order.customerName, order.customerEmail]
          .join(" ")
          .toLowerCase()

        if (!haystack.includes(normalizedQuery)) {
          return false
        }
      }

      if (archiveFilter === "active" && order.archivedAt) {
        return false
      }

      if (archiveFilter === "archived" && !order.archivedAt) {
        return false
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

        const maxAge = dateRangeFilter === "7d" ? 7 : dateRangeFilter === "30d" ? 30 : 90

        if (orderTime < nowTimestamp - maxAge * 24 * 60 * 60 * 1000) {
          return false
        }
      }

      return true
    })
  }, [
    archiveFilter,
    dateRangeFilter,
    deferredSearchQuery,
    fulfillmentFilter,
    nowTimestamp,
    orders,
    paymentFilter,
    statusFilter,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredOrders.slice(startIndex, startIndex + pageSize)
  }, [currentPage, filteredOrders, pageSize])

  const selectedOrder = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId || order.orderNumber === selectedOrderId) ??
      null
    : null

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
  const firearmOrders = filteredOrders.filter((order) => order.containsFirearm).length
  const archivedOrders = filteredOrders.filter((order) => Boolean(order.archivedAt)).length
  const awaitingAction = filteredOrders.filter(
    (order) =>
      !order.archivedAt &&
      (order.status === "PENDING" ||
        order.status === "AWAITING_PAYMENT" ||
        order.fulfillmentStatus === "UNFULFILLED"),
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
            Review live order history, edit fulfillment details, and retire records safely.
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
          helper={`${archivedOrders} archived order(s) in the current view.`}
        />
        <StatCard
          label="Visible Revenue"
          value={formatCurrency(totalRevenue)}
          helper="Sum of the filtered order totals."
        />
        <StatCard
          label="Firearm Orders"
          value={String(firearmOrders).padStart(2, "0")}
          helper={`${awaitingAction} active orders still need follow-up or fulfillment movement.`}
        />
      </div>

      <Card className="border-border/60 bg-surface-container-low">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.12em]">
            Filters
          </CardTitle>
          <CardDescription>Search by order id, customer, or status signals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search order number, id, customer, or email"
              className="pl-9"
            />
          </div>

          <Select
            value={archiveFilter}
            onValueChange={(value) => {
              setArchiveFilter(value as ArchiveFilter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Archive state" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="archived">Archived only</SelectItem>
                <SelectItem value="all">All records</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Order status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All order statuses</SelectItem>
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {humanizeEnum(option)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={paymentFilter}
            onValueChange={(value) => {
              setPaymentFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All payment states</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PENDING_PAYMENT">Pending payment</SelectItem>
                <SelectItem value="PAYMENT_VALIDATION_RECEIVED">Validation received</SelectItem>
                <SelectItem value="AUTHORIZED">Authorized</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PAYMENT_DECLINED">Declined</SelectItem>
                <SelectItem value="PAYMENT_FAILED">Payment failed</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially refunded</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <Select
              value={fulfillmentFilter}
              onValueChange={(value) => {
                setFulfillmentFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Fulfillment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All fulfillment states</SelectItem>
                  {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {humanizeEnum(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={dateRangeFilter}
              onValueChange={(value) => {
                setDateRangeFilter(value as DateRangeFilter)
                setPage(1)
              }}
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
                    <TableHead className="w-[72px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id} className={order.archivedAt ? "opacity-75" : undefined}>
                      <TableCell className="px-4 py-3">
                        <button onClick={() => setSelectedOrderId(order.id)} className="flex flex-col text-left">
                          <span className="font-medium text-foreground">{order.orderNumber}</span>
                          <span className="text-xs text-muted-foreground">{order.id}</span>
                          {order.archivedAt ? (
                            <span className="mt-1 text-[10px] uppercase text-muted-foreground/70">
                              Archived
                            </span>
                          ) : null}
                        </button>
                      </TableCell>
                      <TableCell className="py-3">
                        <button onClick={() => setSelectedOrderId(order.id)} className="flex flex-col text-left">
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
                        {getOrderTrackingSummary(order)}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <OrderActionsMenu
                          order={order}
                          onEdit={(nextOrder) => setSelectedOrderId(nextOrder.id)}
                          onArchive={(nextOrder) => void handleArchiveFromMenu(nextOrder)}
                          disabled={activeOrderActionId === order.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              itemLabel="orders"
              totalItems={filteredOrders.length}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize)
                setPage(1)
              }}
            />
          </Card>

          <div className="grid gap-4 lg:hidden">
            {paginatedOrders.map((order) => (
              <Card key={order.id} className="border-border/60 bg-surface-container-low">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {order.orderNumber}
                      </CardTitle>
                      <CardDescription>{formatDateTime(order.createdAt)}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.archivedAt ? <Badge variant="outline">Archived</Badge> : null}
                      {order.containsFirearm ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <ShieldCheck className="size-3" />
                          FFL
                        </span>
                      ) : null}
                    </div>
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
                        {getOrderTrackingSummary(order)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">{order.itemCount} item(s)</div>
                    <div className="flex items-center gap-2">
                      <div className="font-display text-lg font-bold text-foreground">
                        {formatCurrency(order.total)}
                      </div>
                      <OrderActionsMenu
                        order={order}
                        onEdit={(nextOrder) => setSelectedOrderId(nextOrder.id)}
                        onArchive={(nextOrder) => void handleArchiveFromMenu(nextOrder)}
                        disabled={activeOrderActionId === order.id}
                      />
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
            <Card className="border-border/60 bg-surface-container-low lg:hidden">
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                itemLabel="orders"
                totalItems={filteredOrders.length}
                onPageChange={setPage}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize)
                  setPage(1)
                }}
              />
            </Card>
          </div>
        </>
      )}

      <OrderDetailSheet
        order={selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
        onRefreshOrders={refreshOrders}
      />
    </div>
  )
}
