"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"

import type { Schema } from "@/amplify/data/resource"
import {
  ADMIN_ORDER_SELECTION,
  type AdminFulfillmentStatus,
  type AdminOrderStatus,
} from "@/lib/admin/shared"
import { amplifyOutputs } from "@/lib/auth/amplify-server"
import { requireAdmin } from "@/lib/auth/server"

const ADMIN_ORDER_STATUS_VALUES: AdminOrderStatus[] = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PROCESSING",
  "READY_FOR_TRANSFER",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
]

const ADMIN_FULFILLMENT_STATUS_VALUES: AdminFulfillmentStatus[] = [
  "UNFULFILLED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "DELIVERED",
  "TRANSFERRED",
  "COMPLETED",
  "CANCELLED",
]

function getAdminClient() {
  return generateServerClientUsingCookies<Schema>({
    config: amplifyOutputs,
    cookies,
    authMode: "userPool",
  })
}

function optionalString(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function revalidateAdminOrderViews() {
  revalidatePath("/admin/orders")
  revalidatePath("/admin/customers")
}

export async function updateOrderAdminAction(input: {
  id: string
  status: AdminOrderStatus
  fulfillmentStatus: AdminFulfillmentStatus
  customerShipment: {
    shippingMethod: string
    shippingCarrier: string
    trackingNumber: string
  }
  fflShipment: {
    shippingMethod: string
    shippingCarrier: string
    trackingNumber: string
  }
}) {
  await requireAdmin({ redirectTo: "/admin/orders" })

  if (!input.id) {
    throw new Error("Order id is required.")
  }

  if (!ADMIN_ORDER_STATUS_VALUES.includes(input.status)) {
    throw new Error("Invalid order status.")
  }

  if (!ADMIN_FULFILLMENT_STATUS_VALUES.includes(input.fulfillmentStatus)) {
    throw new Error("Invalid fulfillment status.")
  }

  const client = getAdminClient()
  const existing = await client.models.Order.get(
    { id: input.id },
    { selectionSet: ADMIN_ORDER_SELECTION },
  )

  if (existing.errors?.length) {
    throw new Error(existing.errors.map((error) => error.message).join("; "))
  }

  if (!existing.data) {
    throw new Error("Order not found.")
  }

  if (existing.data.archivedAt) {
    throw new Error("Archived orders must be restored before they can be edited.")
  }

  const customerShipmentHasData = Boolean(
    optionalString(input.customerShipment.shippingMethod) ||
      optionalString(input.customerShipment.shippingCarrier) ||
      optionalString(input.customerShipment.trackingNumber),
  )

  const preferredShipment = customerShipmentHasData ? input.customerShipment : input.fflShipment

  const response = await client.models.Order.update({
    id: input.id,
    status: input.status,
    fulfillmentStatus: input.fulfillmentStatus,
    shippingMethod: optionalString(preferredShipment.shippingMethod) ?? undefined,
    shippingCarrier: optionalString(preferredShipment.shippingCarrier) ?? undefined,
    trackingNumber: optionalString(preferredShipment.trackingNumber) ?? undefined,
  })

  if (response.errors?.length) {
    throw new Error(response.errors.map((error) => error.message).join("; "))
  }

  revalidateAdminOrderViews()
}

export async function archiveOrderAdminAction(id: string) {
  await requireAdmin({ redirectTo: "/admin/orders" })

  if (!id) {
    throw new Error("Order id is required.")
  }

  const client = getAdminClient()
  const response = await client.models.Order.update({
    id,
    archivedAt: new Date().toISOString(),
  })

  if (response.errors?.length) {
    throw new Error(response.errors.map((error) => error.message).join("; "))
  }

  revalidateAdminOrderViews()
}

export async function deleteOrderAdminAction(id: string) {
  void id
  await requireAdmin({ redirectTo: "/admin/orders" })
  throw new Error("Permanent order deletion is currently unavailable. Archive the order instead.")
}
