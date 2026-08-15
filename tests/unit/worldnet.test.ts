import { describe, expect, it } from "vitest"
import {
  applyWorldnetCallback,
  buildWorldnetRequestHashString,
  formatWorldnetAmount,
  formatWorldnetDateTime,
  sha512Hex,
  verifyWorldnetCallbackHash,
  type WorldnetPaymentState,
  normalizeUsPhoneForAmplify,
} from "@/lib/worldnet/shared"

describe("Worldnet helpers", () => {
  it("formats datetimes as DD-MM-YYYY:HH:MM:SS:SSS", () => {
    expect(formatWorldnetDateTime(new Date("2026-05-25T16:07:08.009Z"))).toBe(
      "25-05-2026:16:07:08:009",
    )
  })

  it("formats amounts as fixed two-decimal strings", () => {
    expect(formatWorldnetAmount(123.4)).toBe("123.40")
    expect(formatWorldnetAmount(123.45)).toBe("123.45")
  })

  it("builds the multi-currency request hash string exactly", () => {
    expect(
      buildWorldnetRequestHashString({
        terminalId: "4480001",
        orderId: "JFC2605251234560001",
        currency: "USD",
        amount: "123.45",
        dateTime: "25-05-2026:16:07:08:009",
        receiptPageUrl: "https://local.weland.family/checkout/worldnet/receipt",
        validationUrl: "https://local.weland.family/api/worldnet/validation",
        terminalSecret: "mySharedSecretUSD",
        hashMode: "multi_currency",
      }),
    ).toBe(
      "4480001:JFC2605251234560001:USD:123.45:25-05-2026:16:07:08:009:https://local.weland.family/checkout/worldnet/receipt:https://local.weland.family/api/worldnet/validation:mySharedSecretUSD",
    )
  })

  it("builds legacy MD5 hash strings without separators", () => {
    expect(
      buildWorldnetRequestHashString({
        terminalId: "4480001",
        orderId: "JFC2605251234560001",
        currency: "USD",
        amount: "123.45",
        dateTime: "25-05-2026:16:07:08:009",
        receiptPageUrl: "https://local.weland.family/checkout/worldnet/receipt",
        validationUrl: "https://local.weland.family/api/worldnet/validation",
        terminalSecret: "mySharedSecretUSD",
        hashMode: "multi_currency",
        hashAlgorithm: "md5_legacy",
      }),
    ).toBe(
      "4480001JFC2605251234560001USD123.4525-05-2026:16:07:08:009https://local.weland.family/checkout/worldnet/receipthttps://local.weland.family/api/worldnet/validationmySharedSecretUSD",
    )
  })


  it("moves an approved validation plus receipt into paid", () => {
    const initial: WorldnetPaymentState = {
      status: "PENDING_PAYMENT",
      amount: "123.45",
      currency: "USD",
      terminalId: "4480001",
    }

    const validation = applyWorldnetCallback({
      current: initial,
      source: "validation",
      verified: true,
      nowIso: "2026-05-25T16:10:00.000Z",
      payload: {
        terminalId: "4480001",
        orderId: "JFC2605251234560001",
        amount: "123.45",
        currency: "USD",
        dateTime: "25-05-2026:16:09:59:001",
        responseCode: "A",
        responseText: "APPROVED",
        uniqueRef: "1234567890",
        approvalCode: "999999",
        hash: "unused",
      },
    })

    expect(validation.status).toBe("PAYMENT_VALIDATION_RECEIVED")

    const receipt = applyWorldnetCallback({
      current: validation,
      source: "receipt",
      verified: true,
      nowIso: "2026-05-25T16:10:05.000Z",
      payload: {
        terminalId: "4480001",
        orderId: "JFC2605251234560001",
        amount: "123.45",
        currency: "USD",
        dateTime: "25-05-2026:16:10:04:001",
        responseCode: "A",
        responseText: "APPROVED",
        uniqueRef: "1234567890",
        approvalCode: "999999",
        hash: "unused",
      },
    })

    expect(receipt.status).toBe("PAID")
    expect(receipt.uniqueRef).toBe("1234567890")
  })

  it("marks declined callbacks as declined", () => {
    const declined = applyWorldnetCallback({
      current: {
        status: "PENDING_PAYMENT",
        amount: "123.45",
        currency: "USD",
        terminalId: "4480001",
      },
      source: "validation",
      verified: true,
      payload: {
        terminalId: "4480001",
        orderId: "JFC2605251234560002",
        amount: "123.45",
        currency: "USD",
        dateTime: "25-05-2026:16:10:04:001",
        responseCode: "D",
        responseText: "DECLINED",
        uniqueRef: "2234567890",
        approvalCode: "",
        hash: "unused",
      },
    })

    expect(declined.status).toBe("PAYMENT_DECLINED")
  })

  it("keeps duplicate callbacks idempotent", () => {
    const initial: WorldnetPaymentState = {
      status: "PENDING_PAYMENT",
      amount: "123.45",
      currency: "USD",
      terminalId: "4480001",
    }

    const first = applyWorldnetCallback({
      current: initial,
      source: "validation",
      verified: true,
      nowIso: "2026-05-25T16:10:00.000Z",
      payload: {
        terminalId: "4480001",
        orderId: "JFC2605251234560003",
        amount: "123.45",
        currency: "USD",
        dateTime: "25-05-2026:16:09:59:001",
        responseCode: "A",
        responseText: "APPROVED",
        uniqueRef: "3234567890",
        approvalCode: "999999",
        hash: "unused",
      },
    })
    const second = applyWorldnetCallback({
      current: first,
      source: "validation",
      verified: true,
      nowIso: "2026-05-25T16:15:00.000Z",
      payload: {
        terminalId: "4480001",
        orderId: "JFC2605251234560003",
        amount: "123.45",
        currency: "USD",
        dateTime: "25-05-2026:16:09:59:001",
        responseCode: "A",
        responseText: "APPROVED",
        uniqueRef: "3234567890",
        approvalCode: "999999",
        hash: "unused",
      },
    })

    expect(second.status).toBe("PAYMENT_VALIDATION_RECEIVED")
    expect(second.validationReceivedAt).toBe("2026-05-25T16:10:00.000Z")
  })

  it("rejects invalid hashes", () => {
    const invalid = verifyWorldnetCallbackHash({
      terminalId: "4480001",
      amount: "123.45",
      currency: "USD",
      payload: {
        terminalId: "4480001",
        orderId: "JFC2605251234560004",
        amount: "123.45",
        currency: "USD",
        dateTime: "25-05-2026:16:10:04:001",
        responseCode: "A",
        responseText: "APPROVED",
        uniqueRef: "4234567890",
        approvalCode: "999999",
        hash: sha512Hex("not-the-real-hash"),
      },
      config: {
        env: "sandbox",
        paymentUrl: "https://testpayments.worldnettps.com/merchant/paymentpage",
        terminalId: "4480001",
        terminalSecret: "mySharedSecretUSD",
        currency: "USD",
        hashMode: "multi_currency",
        hashAlgorithm: "sha512",
        receiptPageUrl: "https://local.weland.family/checkout/worldnet/receipt",
        validationUrl: "https://local.weland.family/api/worldnet/validation",
      },
    })

    expect(invalid.matches).toBe(false)
  })

  it("normalizes checkout phone numbers for Amplify AWSPhone fields", () => {
    expect(normalizeUsPhoneForAmplify("555-123-4567")).toBe("+15551234567")
    expect(normalizeUsPhoneForAmplify("(555) 123-4567")).toBe("+15551234567")
    expect(normalizeUsPhoneForAmplify("+15551234567")).toBe("+15551234567")
    expect(normalizeUsPhoneForAmplify("extension only")).toBeUndefined()
  })
})
