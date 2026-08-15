import Link from "next/link"
import { getServerAuthState } from "@/lib/auth/server"
import {
  recordWorldnetCallback,
  reconcileWorldnetOrderForSignedInCustomer,
} from "@/lib/worldnet/server"

type ReceiptPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "")
}

export default async function WorldnetReceiptPage({ searchParams }: ReceiptPageProps) {
  const resolvedSearchParams = await searchParams
  const params = new URLSearchParams(
    Object.entries(resolvedSearchParams).map(([key, value]) => [key, firstValue(value)]),
  )
  const callbackResult = await recordWorldnetCallback({
    source: "receipt",
    fields: params,
  })
  const authState = await getServerAuthState()
  const reconciliation =
    callbackResult.ok &&
    authState?.cognitoSub &&
    callbackResult.payment?.customerId === authState.cognitoSub
      ? await reconcileWorldnetOrderForSignedInCustomer(callbackResult.payment.orderNumber)
      : null

  const payment = callbackResult.payment
  const orderNumber = payment?.orderNumber ?? firstValue(resolvedSearchParams.ORDERID)

  if (!callbackResult.ok) {
    return (
      <main className="min-h-screen bg-surface">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-20">
          <p className="font-display text-[10px] font-semibold uppercase text-primary" style={{ letterSpacing: "0.18em" }}>
            Worldnet Receipt
          </p>
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            We Couldn&apos;t Verify That Payment Response
          </h1>
          <p className="text-sm text-muted-foreground">
            We did not trust the redirect back from the hosted payment page because the Worldnet
            response hash did not validate. Your order remains unpaid until a valid background
            validation arrives.
          </p>
          <p className="text-xs text-muted-foreground">Order: {orderNumber || "Unavailable"}</p>
          <div>
            <Link href="/checkout" className="text-sm font-semibold text-primary">
              Return to checkout
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const status = payment?.status
  const isPaid = reconciliation?.state === "paid"
  const isDeclined = status === "PAYMENT_DECLINED"
  const isFailed = status === "PAYMENT_FAILED"
  const awaitingValidation =
    !isPaid && status !== "PAYMENT_DECLINED" && status !== "PAYMENT_FAILED"

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-20">
        <p className="font-display text-[10px] font-semibold uppercase text-primary" style={{ letterSpacing: "0.18em" }}>
          Worldnet Receipt
        </p>
        <h1 className="font-display text-3xl font-bold uppercase text-foreground">
          {isPaid
            ? "Payment Confirmed"
            : isDeclined
              ? "Payment Declined"
              : isFailed
                ? "Payment Failed"
                : "Waiting For Worldnet Validation"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isPaid
            ? "Your payment was approved and the order has moved into the existing paid review and fulfillment flow."
            : isDeclined
              ? "Worldnet reported this payment as declined. Your order remains awaiting payment."
              : isFailed
                ? "Worldnet returned a non-approved response. Your order remains awaiting payment."
                : "We received the hosted-page redirect, but we are still waiting for the verified background validation before we trust the payment result."}
        </p>
        <div className="bg-surface-container p-4 text-sm text-foreground">
          <p>Order: {orderNumber}</p>
          <p>Payment status: {status?.replaceAll("_", " ") ?? "Unavailable"}</p>
          <p>Worldnet reference: {payment?.uniqueRef ?? "Pending"}</p>
        </div>
        {awaitingValidation ? (
          <p className="text-xs text-muted-foreground">
            If this page does not update after the validation callback arrives, refresh it once.
            The checkout cart is intentionally left untouched until payment is confirmed.
          </p>
        ) : null}
        <div>
          <Link
            href={isPaid ? "/account/orders" : "/checkout"}
            className="text-sm font-semibold text-primary"
          >
            {isPaid ? "View your orders" : "Return to checkout"}
          </Link>
        </div>
      </div>
    </main>
  )
}
