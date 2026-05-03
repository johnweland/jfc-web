import type { Schema } from "@/amplify/data/resource"

export const ADMIN_LIST_LIMIT = 1000

export const ADMIN_CUSTOMER_PROFILE_SELECTION = [
  "customerId",
  "cognitoSub",
  "email",
  "firstName",
  "lastName",
  "phone",
  "defaultShippingAddressId",
  "defaultFflLocationId",
  "createdAt",
  "updatedAt",
] as const

export const ADMIN_CUSTOMER_ADDRESS_SELECTION = [
  "id",
  "customerId",
  "label",
  "recipientName",
  "phone",
  "line1",
  "line2",
  "city",
  "state",
  "postalCode",
  "country",
  "isDefault",
  "createdAt",
  "updatedAt",
] as const

export const ADMIN_CUSTOMER_FFL_SELECTION = [
  "id",
  "customerId",
  "fflName",
  "fflNumber",
  "contactName",
  "phone",
  "email",
  "address.*",
  "isDefault",
  "notes",
  "createdAt",
  "updatedAt",
] as const

export const ADMIN_ORDER_SELECTION = [
  "id",
  "customerId",
  "orderNumber",
  "status",
  "paymentStatus",
  "fulfillmentStatus",
  "subtotal",
  "tax",
  "shipping",
  "fees",
  "total",
  "shippingMethod",
  "shippingCarrier",
  "trackingNumber",
  "shippingAddressSnapshot.*",
  "transferFflSnapshot.*",
  "items.*",
  "createdAt",
  "updatedAt",
] as const

export type CustomerProfileRecord = Schema["CustomerProfile"]["type"]
export type CustomerAddressRecord = Schema["CustomerAddress"]["type"]
export type CustomerFflLocationRecord = Schema["CustomerFflLocation"]["type"]
export type OrderRecord = Schema["Order"]["type"]
export type OrderItemRecord = NonNullable<NonNullable<OrderRecord["items"]>[number]>
export type PostalAddressRecord = NonNullable<OrderRecord["shippingAddressSnapshot"]>
export type FflLocationSnapshotRecord = NonNullable<OrderRecord["transferFflSnapshot"]>

export type AdminOrderStatus = OrderRecord["status"]
export type AdminPaymentStatus = OrderRecord["paymentStatus"]
export type AdminFulfillmentStatus = OrderRecord["fulfillmentStatus"]

export type AdminOrder = {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  orderNumber: string
  status: AdminOrderStatus
  paymentStatus: AdminPaymentStatus
  fulfillmentStatus: AdminFulfillmentStatus
  subtotal: number
  tax: number
  shipping: number
  fees: number
  total: number
  shippingMethod?: string | null
  shippingCarrier?: string | null
  trackingNumber?: string | null
  shippingAddressSnapshot?: OrderRecord["shippingAddressSnapshot"]
  transferFflSnapshot?: OrderRecord["transferFflSnapshot"]
  items: OrderItemRecord[]
  createdAt: string
  updatedAt: string
  itemCount: number
  containsFirearm: boolean
}

export type AdminCustomer = {
  customerId: string
  cognitoSub: string
  email: string
  firstName?: string | null
  lastName?: string | null
  fullName: string
  phone?: string | null
  defaultShippingAddressId?: string | null
  defaultFflLocationId?: string | null
  createdAt: string
  updatedAt: string
  addresses: CustomerAddressRecord[]
  fflLocations: CustomerFflLocationRecord[]
  orders: AdminOrder[]
  orderCount: number
  totalSpend: number
  mostRecentOrderDate?: string
}

function compareIsoDesc(left?: string | null, right?: string | null) {
  return (right ?? "").localeCompare(left ?? "")
}

function sortByCreatedDesc<T extends { createdAt?: string | null }>(records: T[]) {
  return [...records].sort((left, right) => compareIsoDesc(left.createdAt, right.createdAt))
}

export function formatCustomerName(
  customer: Pick<CustomerProfileRecord, "firstName" | "lastName" | "email" | "customerId">,
) {
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim()
  return fullName || customer.email || customer.customerId
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "Unavailable"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return "Unavailable"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed)
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Unavailable"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return "Unavailable"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed)
}

export function humanizeEnum(value?: string | null) {
  if (!value) {
    return "Unavailable"
  }

  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function formatAddressLines(
  address?: {
    line1?: string | null
    line2?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
  } | null,
) {
  if (!address?.line1) {
    return []
  }

  const locality = [address.city, address.state, address.postalCode].filter(Boolean).join(", ")

  return [
    address.line1,
    address.line2 ?? "",
    locality,
    address.country?.toUpperCase() === "US" ? "United States" : (address.country ?? ""),
  ].filter(Boolean)
}

export function buildAdminOrders(
  orders: OrderRecord[],
  customers: CustomerProfileRecord[],
) {
  const customersById = new Map(customers.map((customer) => [customer.customerId, customer]))

  return [...orders]
    .map<AdminOrder>((order) => {
      const customer = customersById.get(order.customerId)
      const items = (order.items ?? []).filter((item): item is OrderItemRecord => Boolean(item))

      return {
        id: order.id,
        customerId: order.customerId,
        customerName: customer ? formatCustomerName(customer) : order.customerId,
        customerEmail: customer?.email ?? "Unavailable",
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        fees: order.fees,
        total: order.total,
        shippingMethod: order.shippingMethod,
        shippingCarrier: order.shippingCarrier,
        trackingNumber: order.trackingNumber,
        shippingAddressSnapshot: order.shippingAddressSnapshot,
        transferFflSnapshot: order.transferFflSnapshot,
        items,
        createdAt: order.createdAt ?? "",
        updatedAt: order.updatedAt ?? "",
        itemCount: items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
        containsFirearm: items.some(
          (item) => item.fflRequired || item.itemType === "FIREARM",
        ),
      }
    })
    .sort((left, right) => compareIsoDesc(left.createdAt, right.createdAt))
}

export function buildAdminCustomers(
  profiles: CustomerProfileRecord[],
  addresses: CustomerAddressRecord[],
  fflLocations: CustomerFflLocationRecord[],
  orders: OrderRecord[],
) {
  const ordersByCustomerId = new Map<string, AdminOrder[]>()
  const builtOrders = buildAdminOrders(orders, profiles)

  for (const order of builtOrders) {
    const current = ordersByCustomerId.get(order.customerId) ?? []
    current.push(order)
    ordersByCustomerId.set(order.customerId, current)
  }

  const addressesByCustomerId = new Map<string, CustomerAddressRecord[]>()

  for (const address of addresses) {
    const current = addressesByCustomerId.get(address.customerId) ?? []
    current.push(address)
    addressesByCustomerId.set(address.customerId, current)
  }

  const fflsByCustomerId = new Map<string, CustomerFflLocationRecord[]>()

  for (const location of fflLocations) {
    const current = fflsByCustomerId.get(location.customerId) ?? []
    current.push(location)
    fflsByCustomerId.set(location.customerId, current)
  }

  return [...profiles]
    .map<AdminCustomer>((profile) => {
      const customerOrders = ordersByCustomerId.get(profile.customerId) ?? []
      const customerAddresses = sortByCreatedDesc(addressesByCustomerId.get(profile.customerId) ?? [])
      const customerFfls = sortByCreatedDesc(fflsByCustomerId.get(profile.customerId) ?? [])

      return {
        customerId: profile.customerId,
        cognitoSub: profile.cognitoSub,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: formatCustomerName(profile),
        phone: profile.phone,
        defaultShippingAddressId: profile.defaultShippingAddressId,
        defaultFflLocationId: profile.defaultFflLocationId,
        createdAt: profile.createdAt ?? "",
        updatedAt: profile.updatedAt ?? "",
        addresses: customerAddresses,
        fflLocations: customerFfls,
        orders: customerOrders,
        orderCount: customerOrders.length,
        totalSpend: customerOrders.reduce((sum, order) => sum + order.total, 0),
        mostRecentOrderDate: customerOrders[0]?.createdAt,
      }
    })
    .sort((left, right) => {
      const byRecentOrder = compareIsoDesc(left.mostRecentOrderDate, right.mostRecentOrderDate)

      if (byRecentOrder !== 0) {
        return byRecentOrder
      }

      return compareIsoDesc(left.createdAt, right.createdAt)
    })
}
