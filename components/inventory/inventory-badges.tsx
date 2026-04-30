"use client"

import { Badge } from "@/components/ui/badge"
import type { InventoryStatus, InventorySource } from "@/lib/types/inventory"

const statusConfig: Record<InventoryStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: "AVAILABLE",
    className: "bg-green-900/30 text-green-400 border-green-800/40",
  },
  RESERVED: {
    label: "RESERVED",
    className: "bg-yellow-900/30 text-yellow-400 border-yellow-800/40",
  },
  SOLD: {
    label: "SOLD",
    className: "bg-red-900/30 text-red-400 border-red-800/40",
  },
  DRAFT: {
    label: "DRAFT",
    className: "bg-surface-container text-muted-foreground border-border/40",
  },
  ARCHIVED: {
    label: "ARCHIVED",
    className: "bg-surface-container/50 text-muted-foreground/50 border-border/20",
  },
}

const sourceConfig: Record<InventorySource, { label: string; className: string }> = {
  MANUAL: {
    label: "MANUAL",
    className: "",
  },
  ROCPAY: {
    label: "ROCPAY",
    className: "bg-blue-900/30 text-blue-400 border-blue-800/40",
  },
  FFLSAFE: {
    label: "FFLSAFE",
    className: "bg-orange-900/30 text-orange-400 border-orange-800/40",
  },
}

export function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  const { label, className } = statusConfig[status]
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold ${className}`}
      style={{ letterSpacing: "0.08em" }}
    >
      {label}
    </Badge>
  )
}

export function InventorySourceBadge({ source }: { source: InventorySource }) {
  const { label, className } = sourceConfig[source]
  if (!className) {
    return (
      <Badge className="text-[10px] font-semibold" style={{ letterSpacing: "0.08em" }}>
        {label}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold ${className}`}
      style={{ letterSpacing: "0.08em" }}
    >
      {label}
    </Badge>
  )
}
