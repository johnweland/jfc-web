"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { humanizeEnum, type AdminFulfillmentStatus, type AdminOrderStatus, type AdminPaymentStatus } from "@/lib/admin/shared"

const orderStatusClasses: Record<AdminOrderStatus, string> = {
  PENDING: "bg-surface-container-highest text-[#decd99]",
  AWAITING_PAYMENT: "bg-surface-container-highest text-[#decd99]",
  PROCESSING: "bg-surface-container-highest text-accent",
  READY_FOR_TRANSFER: "bg-surface-container-highest text-accent",
  COMPLETED: "bg-surface-container-highest text-accent",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-surface-container-highest text-muted-foreground",
}

const paymentStatusClasses: Record<AdminPaymentStatus, string> = {
  UNPAID: "bg-surface-container-highest text-[#decd99]",
  AUTHORIZED: "bg-surface-container-highest text-accent",
  PAID: "bg-surface-container-highest text-accent",
  PARTIALLY_REFUNDED: "bg-surface-container-highest text-muted-foreground",
  REFUNDED: "bg-surface-container-highest text-muted-foreground",
  FAILED: "bg-destructive/10 text-destructive",
}

const fulfillmentStatusClasses: Record<AdminFulfillmentStatus, string> = {
  UNFULFILLED: "bg-surface-container-highest text-[#decd99]",
  PROCESSING: "bg-surface-container-highest text-accent",
  READY_FOR_PICKUP: "bg-surface-container-highest text-accent",
  SHIPPED: "bg-surface-container-highest text-accent",
  DELIVERED: "bg-surface-container-highest text-accent",
  TRANSFERRED: "bg-surface-container-highest text-accent",
  COMPLETED: "bg-surface-container-highest text-accent",
  CANCELLED: "bg-destructive/10 text-destructive",
}

function StatusBadge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("rounded-none border-0 text-[10px] font-semibold uppercase", className)}
      style={{ letterSpacing: "0.12em" }}
    >
      {label}
    </Badge>
  )
}

export function AdminOrderStatusBadge({ status }: { status: AdminOrderStatus }) {
  return <StatusBadge label={humanizeEnum(status)} className={orderStatusClasses[status]} />
}

export function AdminPaymentStatusBadge({ status }: { status: AdminPaymentStatus }) {
  return <StatusBadge label={humanizeEnum(status)} className={paymentStatusClasses[status]} />
}

export function AdminFulfillmentStatusBadge({
  status,
}: {
  status: AdminFulfillmentStatus
}) {
  return <StatusBadge label={humanizeEnum(status)} className={fulfillmentStatusClasses[status]} />
}
