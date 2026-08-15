import { createHash, randomInt } from "node:crypto"

export type WorldnetHashMode = "single_currency" | "multi_currency"
export type WorldnetHashAlgorithm = "sha512" | "md5_legacy"
export type WorldnetResponseCode = "A" | "D" | "E" | "R" | "C" | ""
export type OrderPaymentStatus =
  | "UNPAID"
  | "PENDING_PAYMENT"
  | "PAYMENT_VALIDATION_RECEIVED"
  | "AUTHORIZED"
  | "PAID"
  | "PAYMENT_DECLINED"
  | "PAYMENT_FAILED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "FAILED"

export type WorldnetConfig = {
  env: string
  paymentUrl: string
  terminalId: string
  terminalSecret: string
  currency: string
  hashMode: WorldnetHashMode
  hashAlgorithm: WorldnetHashAlgorithm
  receiptPageUrl: string
  validationUrl?: string
}

export type WorldnetRequestFields = Record<string, string>

export type WorldnetCallbackPayload = {
  terminalId: string
  orderId: string
  currency?: string
  amount: string
  dateTime: string
  responseCode: WorldnetResponseCode
  responseText: string
  uniqueRef?: string
  approvalCode?: string
  hash: string
  email?: string
  phone?: string
  country?: string
  cardType?: string
  cardNumber?: string
  avsResponse?: string
  cvvResponse?: string
}

export type WorldnetPaymentState = {
  status: OrderPaymentStatus
  amount: string
  currency: string
  terminalId: string
  validationObserved?: boolean
  validationHashValidated?: boolean
  validationReceivedAt?: string
  receiptObserved?: boolean
  receiptHashValidated?: boolean
  receiptReceivedAt?: string
  uniqueRef?: string
  approvalCode?: string
  responseCode?: string
  responseText?: string
  receiptFields?: Record<string, string>
  validationFields?: Record<string, string>
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required Worldnet env var: ${name}`)
  }
  return value
}

function joinUrl(baseUrl: string, path: string) {
  return new URL(path, baseUrl).toString()
}

export function getWorldnetConfig(): WorldnetConfig {
  const siteUrl = requiredEnv("NEXT_PUBLIC_SITE_URL")
  const hashMode = (process.env.WORLDNET_HASH_MODE?.trim().toLowerCase() ??
    "multi_currency") as WorldnetHashMode
  const hashAlgorithm = (process.env.WORLDNET_HASH_ALGORITHM?.trim().toLowerCase() ??
    "sha512") as WorldnetHashAlgorithm

  if (hashMode !== "single_currency" && hashMode !== "multi_currency") {
    throw new Error("WORLDNET_HASH_MODE must be single_currency or multi_currency")
  }

  if (hashAlgorithm !== "sha512" && hashAlgorithm !== "md5_legacy") {
    throw new Error("WORLDNET_HASH_ALGORITHM must be sha512 or md5_legacy")
  }

  return {
    env: process.env.WORLDNET_ENV?.trim() || "sandbox",
    paymentUrl: requiredEnv("WORLDNET_PAYMENT_URL"),
    terminalId: requiredEnv("WORLDNET_TERMINAL_ID"),
    terminalSecret: requiredEnv("WORLDNET_TERMINAL_SECRET"),
    currency: requiredEnv("WORLDNET_CURRENCY"),
    hashMode,
    hashAlgorithm,
    receiptPageUrl: joinUrl(siteUrl, requiredEnv("WORLDNET_RECEIPT_PATH")),
    validationUrl:
      process.env.WORLDNET_BACKGROUND_VALIDATION_ENABLED === "1"
        ? joinUrl(siteUrl, requiredEnv("WORLDNET_VALIDATION_PATH"))
        : undefined,
  }
}

export function formatWorldnetDateTime(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const year = String(date.getUTCFullYear())
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0")

  return `${day}-${month}-${year}:${hours}:${minutes}:${seconds}:${milliseconds}`
}

export function formatWorldnetAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid Worldnet amount: ${amount}`)
  }

  return amount.toFixed(2)
}

export function sha512Hex(value: string) {
  return createHash("sha512").update(value, "utf8").digest("hex")
}

export function md5Hex(value: string) {
  return createHash("md5").update(value, "utf8").digest("hex")
}

export function buildWorldnetHashString(
  parts: Array<string | null | undefined>,
  algorithm: WorldnetHashAlgorithm = "sha512",
) {
  const values = parts.filter((part): part is string => typeof part === "string" && part.length > 0)

  if (algorithm === "md5_legacy") {
    return values.join("")
  }

  return parts
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(":")
}

export function hashWorldnetString(value: string, algorithm: WorldnetHashAlgorithm = "sha512") {
  return algorithm === "md5_legacy" ? md5Hex(value) : sha512Hex(value)
}

export function buildWorldnetRequestHashString(input: {
  terminalId: string
  orderId: string
  currency: string
  amount: string
  dateTime: string
  receiptPageUrl?: string
  validationUrl?: string
  terminalSecret: string
  hashMode: WorldnetHashMode
  hashAlgorithm?: WorldnetHashAlgorithm
}) {
  const parts =
    input.hashMode === "multi_currency"
      ? [
          input.terminalId,
          input.orderId,
          input.currency,
          input.amount,
          input.dateTime,
          input.receiptPageUrl,
          input.validationUrl,
          input.terminalSecret,
        ]
      : [
          input.terminalId,
          input.orderId,
          input.amount,
          input.dateTime,
          input.receiptPageUrl,
          input.validationUrl,
          input.terminalSecret,
        ]

  return buildWorldnetHashString(parts, input.hashAlgorithm)
}

export function buildWorldnetResponseHashString(input: {
  terminalId: string
  orderId: string
  currency: string
  amount: string
  dateTime: string
  responseCode: string
  responseText: string
  terminalSecret: string
  hashMode: WorldnetHashMode
  hashAlgorithm?: WorldnetHashAlgorithm
}) {
  const parts =
    input.hashMode === "multi_currency"
      ? [
          input.terminalId,
          input.orderId,
          input.currency,
          input.amount,
          input.dateTime,
          input.responseCode,
          input.responseText,
          input.terminalSecret,
        ]
      : [
          input.terminalId,
          input.orderId,
          input.amount,
          input.dateTime,
          input.responseCode,
          input.responseText,
          input.terminalSecret,
        ]

  return buildWorldnetHashString(parts, input.hashAlgorithm)
}

export function buildWorldnetHostedPaymentFields(input: {
  orderId: string
  amount: number
  email: string
  cardholderName: string
  description: string
  phone?: string
  address1?: string
  address2?: string
  city?: string
  region?: string
  postCode?: string
  country?: string
  now?: Date
  config?: WorldnetConfig
}) {
  const config = input.config ?? getWorldnetConfig()
  const dateTime = formatWorldnetDateTime(input.now ?? new Date())
  const amount = formatWorldnetAmount(input.amount)
  const hashString = buildWorldnetRequestHashString({
    terminalId: config.terminalId,
    orderId: input.orderId,
    currency: config.currency,
    amount,
    dateTime,
    receiptPageUrl: config.receiptPageUrl,
    validationUrl: config.validationUrl,
    terminalSecret: config.terminalSecret,
    hashMode: config.hashMode,
    hashAlgorithm: config.hashAlgorithm,
  })

  const fields: WorldnetRequestFields = {
    TERMINALID: config.terminalId,
    ORDERID: input.orderId,
    CURRENCY: config.currency,
    AMOUNT: amount,
    DATETIME: dateTime,
    HASH: hashWorldnetString(hashString, config.hashAlgorithm),
    RECEIPTPAGEURL: config.receiptPageUrl,
    EMAIL: input.email,
    CARDHOLDERNAME: input.cardholderName,
    DESCRIPTION: input.description,
    TERMINALTYPE: "2",
    TRANSACTIONTYPE: "7",
    PAYMENTOPTIONS: "CARD",
    PHONE: input.phone ?? "",
    ADDRESS1: input.address1 ?? "",
    ADDRESS2: input.address2 ?? "",
    CITY: input.city ?? "",
    REGION: input.region ?? "",
    POSTCODE: input.postCode ?? "",
    COUNTRY: input.country ?? "",
  }

  if (config.validationUrl) {
    fields.VALIDATIONURL = config.validationUrl
  }

  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value.length > 0),
  ) as WorldnetRequestFields
}

export function normalizeWorldnetFields(input: URLSearchParams | FormData | Record<string, string>) {
  if (input instanceof URLSearchParams) {
    return Object.fromEntries(input.entries())
  }

  if (typeof FormData !== "undefined" && input instanceof FormData) {
    return Object.fromEntries(
      Array.from(input.entries()).map(([key, value]) => [key, String(value)]),
    )
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, String(value ?? "")]),
  )
}

export function parseWorldnetCallbackPayload(
  fields: URLSearchParams | FormData | Record<string, string>,
) {
  const normalized = normalizeWorldnetFields(fields)

  return {
    terminalId: normalized.TERMINALID || "",
    orderId: normalized.ORDERID || "",
    currency: normalized.CURRENCY || undefined,
    amount: normalized.AMOUNT || "",
    dateTime: normalized.DATETIME || "",
    responseCode: (normalized.RESPONSECODE || "") as WorldnetResponseCode,
    responseText: normalized.RESPONSETEXT || "",
    uniqueRef: normalized.UNIQUEREF || undefined,
    approvalCode: normalized.APPROVALCODE || undefined,
    hash: normalized.HASH || "",
    email: normalized.EMAIL || undefined,
    phone: normalized.PHONE || undefined,
    country: normalized.COUNTRY || undefined,
    cardType: normalized.CARDTYPE || undefined,
    cardNumber: normalized.CARDNUMBER || undefined,
    avsResponse: normalized.AVSRESPONSE || undefined,
    cvvResponse: normalized.CVVRESPONSE || undefined,
  } satisfies WorldnetCallbackPayload
}

export function verifyWorldnetCallbackHash(input: {
  payload: WorldnetCallbackPayload
  amount: string
  currency: string
  terminalId: string
  config?: WorldnetConfig
}) {
  const config = input.config ?? getWorldnetConfig()
  const expected = hashWorldnetString(
    buildWorldnetResponseHashString({
      terminalId: input.terminalId,
      orderId: input.payload.orderId,
      currency: input.currency,
      amount: input.amount,
      dateTime: input.payload.dateTime,
      responseCode: input.payload.responseCode,
      responseText: input.payload.responseText,
      terminalSecret: config.terminalSecret,
      hashMode: config.hashMode,
      hashAlgorithm: config.hashAlgorithm,
    }),
    config.hashAlgorithm,
  )

  return {
    expected,
    matches: expected.toLowerCase() === input.payload.hash.toLowerCase(),
  }
}

export function applyWorldnetCallback(input: {
  current: WorldnetPaymentState
  source: "receipt" | "validation"
  payload: WorldnetCallbackPayload
  verified: boolean
  nowIso?: string
}) {
  const nowIso = input.nowIso ?? new Date().toISOString()
  const next: WorldnetPaymentState = {
    ...input.current,
    uniqueRef: input.payload.uniqueRef ?? input.current.uniqueRef,
    approvalCode: input.payload.approvalCode ?? input.current.approvalCode,
    responseCode: input.payload.responseCode || input.current.responseCode,
    responseText: input.payload.responseText || input.current.responseText,
  }

  if (input.source === "validation") {
    next.validationObserved = true
    next.validationReceivedAt = next.validationReceivedAt ?? nowIso
    next.validationFields = {
      ORDERID: input.payload.orderId,
      UNIQUEREF: input.payload.uniqueRef ?? "",
      RESPONSECODE: input.payload.responseCode,
      RESPONSETEXT: input.payload.responseText,
      DATETIME: input.payload.dateTime,
      APPROVALCODE: input.payload.approvalCode ?? "",
    }
    next.validationHashValidated = input.verified
  } else {
    next.receiptObserved = true
    next.receiptReceivedAt = next.receiptReceivedAt ?? nowIso
    next.receiptFields = {
      ORDERID: input.payload.orderId,
      UNIQUEREF: input.payload.uniqueRef ?? "",
      RESPONSECODE: input.payload.responseCode,
      RESPONSETEXT: input.payload.responseText,
      DATETIME: input.payload.dateTime,
      APPROVALCODE: input.payload.approvalCode ?? "",
      EMAIL: input.payload.email ?? "",
      PHONE: input.payload.phone ?? "",
      COUNTRY: input.payload.country ?? "",
      CARDTYPE: input.payload.cardType ?? "",
      CARDNUMBER: input.payload.cardNumber ?? "",
    }
    next.receiptHashValidated = input.verified
  }

  if (!input.verified) {
    next.status = "PAYMENT_FAILED"
    return next
  }

  const approved =
    input.payload.responseCode === "A" &&
    next.validationHashValidated &&
    next.receiptHashValidated
  const declined = input.payload.responseCode === "D"
  const failed = !approved && !declined && input.payload.responseCode !== "A"

  if (declined) {
    next.status = "PAYMENT_DECLINED"
    return next
  }

  if (failed) {
    next.status = "PAYMENT_FAILED"
    return next
  }

  if (approved) {
    next.status = "PAID"
    return next
  }

  if (input.source === "validation") {
    next.status = "PAYMENT_VALIDATION_RECEIVED"
    return next
  }

  next.status = next.status === "PAYMENT_VALIDATION_RECEIVED" ? "PAID" : "PENDING_PAYMENT"
  return next
}

export function buildWorldnetOrderNumber(now = new Date()) {
  const year = String(now.getUTCFullYear()).slice(-2)
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  const day = String(now.getUTCDate()).padStart(2, "0")
  const hours = String(now.getUTCHours()).padStart(2, "0")
  const minutes = String(now.getUTCMinutes()).padStart(2, "0")
  const seconds = String(now.getUTCSeconds()).padStart(2, "0")
  const suffix = String(randomInt(0, 10_000)).padStart(4, "0")

  return `JFC${year}${month}${day}${hours}${minutes}${seconds}${suffix}`.slice(0, 24)
}

export function maskWorldnetCardNumber(cardNumber?: string) {
  if (!cardNumber) {
    return undefined
  }

  const digits = cardNumber.replace(/\D/g, "")
  if (digits.length < 4) {
    return "****"
  }

  return `****${digits.slice(-4)}`
}

export function normalizeUsPhoneForAmplify(phone?: string) {
  if (!phone) {
    return undefined
  }

  const trimmed = phone.trim()

  if (!trimmed) {
    return undefined
  }

  const digits = trimmed.replace(/\D/g, "")

  if (digits.length === 10) {
    return `+1${digits}`
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`
  }

  return trimmed.startsWith("+") ? trimmed : undefined
}
