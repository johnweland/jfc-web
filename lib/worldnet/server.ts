import "server-only"

import { cookies } from "next/headers"
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"
import type { Schema } from "@/amplify/data/resource"
import { amplifyOutputs } from "@/lib/auth/amplify-server"
import {
  type OrderPaymentStatus,
  type WorldnetCallbackPayload,
  type WorldnetPaymentState,
  applyWorldnetCallback,
  buildWorldnetHostedPaymentFields,
  buildWorldnetOrderNumber,
  formatWorldnetAmount,
  getWorldnetConfig,
  maskWorldnetCardNumber,
  normalizeUsPhoneForAmplify,
  parseWorldnetCallbackPayload,
  verifyWorldnetCallbackHash,
} from "./shared"

type CartItemInput = {
  slug: string
  name: string
  sku: string
  price: number
  quantity: number
  category: "firearm" | "part" | "apparel"
  requiresFFL: boolean
  size?: string
  color?: string
}

type CheckoutAddressInput = {
  recipientName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country?: string
}

type CheckoutFflInput = {
  fflName: string
  fflNumber?: string
  fflContact: string
  fflPhone?: string
  fflEmail?: string
  fflLine1: string
  fflLine2?: string
  fflCity: string
  fflState: string
  fflPostalCode: string
  notes?: string
}

type CheckoutSubmission = {
  customerId: string
  email: string
  shippingAddress: CheckoutAddressInput
  ffl?: CheckoutFflInput
  items: CartItemInput[]
  subtotal: number
  tax: number
  total: number
}

type WorldnetPaymentRecord = Schema["WorldnetPayment"]["type"]

const WORLNET_PAYMENT_SELECTION = [
  "orderNumber",
  "orderId",
  "customerId",
  "terminalId",
  "currency",
  "amount",
  "hashMode",
  "requestDateTime",
  "status",
  "uniqueRef",
  "approvalCode",
  "responseCode",
  "responseText",
  "receiptReceivedAt",
  "validationReceivedAt",
  "receiptHashValidated",
  "validationHashValidated",
  "receiptObserved",
  "validationObserved",
  "paymentProvider",
  "requestFields",
  "receiptFields",
  "validationFields",
  "createdAt",
  "updatedAt",
] as const

const WORLNET_PAYMENT_CALLBACK_SELECTION = [
  "orderNumber",
  "orderId",
  "customerId",
  "terminalId",
  "currency",
  "amount",
  "hashMode",
  "requestDateTime",
  "status",
  "uniqueRef",
  "approvalCode",
  "responseCode",
  "responseText",
  "receiptHashValidated",
  "validationHashValidated",
  "receiptObserved",
  "validationObserved",
  "paymentProvider",
  "createdAt",
  "updatedAt",
] as const

function getAuthenticatedDataClient() {
  return generateServerClientUsingCookies<Schema>({
    config: amplifyOutputs,
    cookies,
    authMode: "userPool",
  })
}

function getPublicDataClient() {
  return generateServerClientUsingCookies<Schema>({
    config: amplifyOutputs,
    cookies,
    authMode: "apiKey",
  })
}

function toOrderItemSnapshot(item: CartItemInput): NonNullable<Schema["Order"]["createType"]["items"]>[number] {
  return {
    sku: item.sku,
    itemType:
      item.category === "firearm"
        ? "FIREARM"
        : item.category === "apparel"
          ? "APPAREL"
          : "PART",
    title: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    category: item.category.toUpperCase(),
    fflRequired: item.requiresFFL,
    size: item.size,
    color: item.color,
  }
}

function toShippingAddressSnapshot(address: CheckoutAddressInput): Schema["Order"]["createType"]["shippingAddressSnapshot"] {
  return {
    recipientName: address.recipientName,
    phone: normalizeUsPhoneForAmplify(address.phone),
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country ?? "US",
  }
}

function toFflSnapshot(ffl?: CheckoutFflInput): Schema["Order"]["createType"]["transferFflSnapshot"] {
  if (!ffl) {
    return undefined
  }

  return {
    fflName: ffl.fflName,
    fflNumber: ffl.fflNumber,
    contactName: ffl.fflContact,
    phone: normalizeUsPhoneForAmplify(ffl.fflPhone),
    email: ffl.fflEmail,
    notes: ffl.notes,
    address: {
      line1: ffl.fflLine1,
      line2: ffl.fflLine2,
      city: ffl.fflCity,
      state: ffl.fflState,
      postalCode: ffl.fflPostalCode,
      country: "US",
    },
  }
}

function sanitizeReceiptFields(payload: WorldnetCallbackPayload) {
  return {
    ORDERID: payload.orderId,
    UNIQUEREF: payload.uniqueRef ?? "",
    RESPONSECODE: payload.responseCode,
    RESPONSETEXT: payload.responseText,
    DATETIME: payload.dateTime,
    APPROVALCODE: payload.approvalCode ?? "",
    EMAIL: payload.email ?? "",
    PHONE: payload.phone ?? "",
    COUNTRY: payload.country ?? "",
    CARDTYPE: payload.cardType ?? "",
    CARDNUMBER: maskWorldnetCardNumber(payload.cardNumber) ?? "",
  }
}

function stringifyJsonField(value: Record<string, string> | undefined | null) {
  return value ? JSON.stringify(value) : undefined
}

export function parseWorldnetJsonField(value: unknown): Record<string, string> | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === "object"
        ? Object.fromEntries(
            Object.entries(parsed as Record<string, unknown>).map(([key, fieldValue]) => [
              key,
              String(fieldValue ?? ""),
            ]),
          )
        : undefined
    } catch {
      return undefined
    }
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => [
        key,
        String(fieldValue ?? ""),
      ]),
    )
  }

  return undefined
}

function recordToState(record: WorldnetPaymentRecord): WorldnetPaymentState {
  return {
    status: (record.status ?? "PENDING_PAYMENT") as OrderPaymentStatus,
    amount: formatWorldnetAmount(record.amount ?? 0),
    currency: record.currency ?? getWorldnetConfig().currency,
    terminalId: record.terminalId ?? getWorldnetConfig().terminalId,
    validationObserved: record.validationObserved ?? false,
    validationHashValidated: record.validationHashValidated ?? false,
    validationReceivedAt: record.validationReceivedAt ?? undefined,
    receiptObserved: record.receiptObserved ?? false,
    receiptHashValidated: record.receiptHashValidated ?? false,
    receiptReceivedAt: record.receiptReceivedAt ?? undefined,
    uniqueRef: record.uniqueRef ?? undefined,
    approvalCode: record.approvalCode ?? undefined,
    responseCode: record.responseCode ?? undefined,
    responseText: record.responseText ?? undefined,
    receiptFields: parseWorldnetJsonField(record.receiptFields),
    validationFields: parseWorldnetJsonField(record.validationFields),
  }
}

export async function createWorldnetCheckoutSession(input: CheckoutSubmission) {
  const config = getWorldnetConfig()
  const orderNumber = buildWorldnetOrderNumber()
  const orderClient = getAuthenticatedDataClient()
  const paymentClient = getPublicDataClient()
  const description = `${input.items.length} item${input.items.length === 1 ? "" : "s"} from Jackson Firearm Co.`

  if (!paymentClient.models.WorldnetPayment) {
    throw new Error(
      "Amplify data schema is missing WorldnetPayment. Deploy/sync the Amplify backend and regenerate amplify_outputs.json before testing checkout.",
    )
  }

  const orderCreate = await orderClient.models.Order.create({
    customerId: input.customerId,
    orderNumber,
    status: "AWAITING_PAYMENT",
    paymentStatus: "PENDING_PAYMENT",
    fulfillmentStatus: "UNFULFILLED",
    subtotal: input.subtotal,
    tax: input.tax,
    shipping: 0,
    fees: 0,
    total: input.total,
    paymentProvider: "WORLDNET",
    shippingAddressSnapshot: toShippingAddressSnapshot(input.shippingAddress),
    transferFflSnapshot: toFflSnapshot(input.ffl),
    items: input.items.map(toOrderItemSnapshot),
  })

  if (orderCreate.errors?.length) {
    throw new Error(orderCreate.errors.map((error) => error.message).join(" "))
  }

  const order = orderCreate.data

  if (!order?.id) {
    throw new Error("Worldnet checkout could not create a pending order.")
  }

  const requestFields = buildWorldnetHostedPaymentFields({
    orderId: orderNumber,
    amount: input.total,
    email: input.email,
    cardholderName: input.shippingAddress.recipientName,
    description,
    phone: input.shippingAddress.phone,
    address1: input.shippingAddress.line1,
    address2: input.shippingAddress.line2,
    city: input.shippingAddress.city,
    region: input.shippingAddress.state,
    postCode: input.shippingAddress.postalCode,
    country: input.shippingAddress.country ?? "US",
    config,
  })

  const paymentCreate = await paymentClient.models.WorldnetPayment.create({
    orderNumber,
    orderId: order.id,
    customerId: input.customerId,
    terminalId: config.terminalId,
    currency: config.currency,
    amount: input.total,
    hashMode: config.hashMode,
    requestDateTime: requestFields.DATETIME,
    status: "PENDING_PAYMENT",
    paymentProvider: "WORLDNET",
    requestFields: stringifyJsonField(requestFields),
  })

  if (paymentCreate.errors?.length) {
    throw new Error(paymentCreate.errors.map((error) => error.message).join(" "))
  }

  console.info("[worldnet] created pending payment session", {
    orderNumber,
    customerId: input.customerId,
    total: requestFields.AMOUNT,
    currency: config.currency,
  })

  return {
    orderId: order.id,
    orderNumber,
    paymentUrl: config.paymentUrl,
    requestFields,
  }
}

export async function getWorldnetPayment(orderNumber: string) {
  const client = getPublicDataClient()
  const response = await client.models.WorldnetPayment.get(
    { orderNumber },
    { selectionSet: WORLNET_PAYMENT_SELECTION },
  )

  if (response.errors?.length) {
    throw new Error(response.errors.map((error) => error.message).join(" "))
  }

  return response.data as WorldnetPaymentRecord | undefined
}

export async function recordWorldnetCallback(input: {
  source: "receipt" | "validation"
  fields: URLSearchParams | FormData | Record<string, string>
}) {
  const client = getPublicDataClient()
  const payload = parseWorldnetCallbackPayload(input.fields)

  if (!payload.orderId) {
    return {
      ok: false as const,
      status: 400,
      message: "Missing ORDERID",
    }
  }

  const existing = await getWorldnetPayment(payload.orderId)

  if (!existing) {
    console.warn("[worldnet] callback received for unknown order", {
      orderNumber: payload.orderId,
      source: input.source,
    })

    return {
      ok: false as const,
      status: 404,
      message: "Unknown ORDERID",
    }
  }

  const amount = formatWorldnetAmount(existing.amount ?? 0)
  const terminalId = payload.terminalId || existing.terminalId || getWorldnetConfig().terminalId
  const currency = payload.currency || existing.currency || getWorldnetConfig().currency
  const hashValidation = verifyWorldnetCallbackHash({
    payload,
    amount,
    currency,
    terminalId,
  })
  const nextState = applyWorldnetCallback({
    current: recordToState(existing),
    source: input.source,
    payload,
    verified: hashValidation.matches,
  })

  const updateInput: Schema["WorldnetPayment"]["updateType"] = {
    orderNumber: existing.orderNumber,
    uniqueRef:
      existing.uniqueRef && payload.uniqueRef && existing.uniqueRef !== payload.uniqueRef
        ? existing.uniqueRef
        : (payload.uniqueRef ?? existing.uniqueRef),
    approvalCode: payload.approvalCode ?? existing.approvalCode,
    responseCode: payload.responseCode || existing.responseCode,
    responseText: payload.responseText || existing.responseText,
    status: nextState.status,
  }

  if (input.source === "receipt") {
    updateInput.receiptObserved = nextState.receiptObserved ?? existing.receiptObserved
    updateInput.receiptHashValidated =
      nextState.receiptHashValidated ?? existing.receiptHashValidated
    updateInput.receiptReceivedAt = nextState.receiptReceivedAt ?? existing.receiptReceivedAt
    updateInput.receiptFields = stringifyJsonField(sanitizeReceiptFields(payload))
  } else {
    updateInput.validationObserved =
      nextState.validationObserved ?? existing.validationObserved
    updateInput.validationHashValidated =
      nextState.validationHashValidated ?? existing.validationHashValidated
    updateInput.validationReceivedAt =
      nextState.validationReceivedAt ?? existing.validationReceivedAt
    updateInput.validationFields = stringifyJsonField({
      ORDERID: payload.orderId,
      UNIQUEREF: payload.uniqueRef ?? "",
      RESPONSECODE: payload.responseCode,
      RESPONSETEXT: payload.responseText,
      DATETIME: payload.dateTime,
      APPROVALCODE: payload.approvalCode ?? "",
    })
  }

  const update = await client.models.WorldnetPayment.update(updateInput, {
    selectionSet: WORLNET_PAYMENT_CALLBACK_SELECTION,
  })

  if (update.errors?.length) {
    throw new Error(update.errors.map((error) => error.message).join(" "))
  }

  console.info("[worldnet] callback processed", {
    orderNumber: existing.orderNumber,
    source: input.source,
    responseCode: payload.responseCode,
    hashVerified: hashValidation.matches,
    status: nextState.status,
  })

  return {
    ok: hashValidation.matches,
    status: hashValidation.matches ? 200 : 400,
    message: hashValidation.matches ? "OK" : "Invalid Worldnet hash",
    payment: update.data as WorldnetPaymentRecord | undefined,
    payload,
    hashValidation,
  }
}

export async function reconcileWorldnetOrderForSignedInCustomer(orderNumber: string) {
  const payment = await getWorldnetPayment(orderNumber)

  if (!payment?.orderId) {
    return {
      ok: false as const,
      state: "missing_payment",
    }
  }

  const authenticatedClient = getAuthenticatedDataClient()
  const nextStatus = payment.status

  if (nextStatus !== "PAID" && nextStatus !== "PAYMENT_DECLINED" && nextStatus !== "PAYMENT_FAILED") {
    return {
      ok: false as const,
      state: "awaiting_validation",
      payment,
    }
  }

  const orderUpdate =
    nextStatus === "PAID"
      ? await authenticatedClient.models.Order.update({
          id: payment.orderId,
          paymentStatus: "PAID",
          status: "PROCESSING",
          fulfillmentStatus: "PROCESSING",
          paymentProvider: "WORLDNET",
          paymentReference: payment.uniqueRef ?? undefined,
        })
      : await authenticatedClient.models.Order.update({
          id: payment.orderId,
          paymentStatus: nextStatus,
          status: "AWAITING_PAYMENT",
          fulfillmentStatus: "UNFULFILLED",
          paymentProvider: "WORLDNET",
          paymentReference: payment.uniqueRef ?? undefined,
        })

  if (orderUpdate.errors?.length) {
    throw new Error(orderUpdate.errors.map((error) => error.message).join(" "))
  }

  return {
    ok: true as const,
    state: nextStatus === "PAID" ? "paid" : "not_paid",
    payment,
    order: orderUpdate.data,
  }
}
