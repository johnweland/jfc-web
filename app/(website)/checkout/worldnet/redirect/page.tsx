import { redirect } from "next/navigation"
import { getServerAuthState, requireSignedIn } from "@/lib/auth/server"
import { getWorldnetPayment, parseWorldnetJsonField } from "@/lib/worldnet/server"
import { getWorldnetConfig } from "@/lib/worldnet/shared"

type WorldnetRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "")
}

export default async function WorldnetRedirectPage({
  searchParams,
}: WorldnetRedirectPageProps) {
  await requireSignedIn("/checkout")

  const resolvedSearchParams = await searchParams
  const orderNumber = firstValue(resolvedSearchParams.order)

  if (!orderNumber) {
    redirect("/checkout")
  }

  const [authState, payment] = await Promise.all([
    getServerAuthState(),
    getWorldnetPayment(orderNumber),
  ])

  const requestFields = parseWorldnetJsonField(payment?.requestFields)

  if (!requestFields || payment?.customerId !== authState?.cognitoSub) {
    redirect("/checkout")
  }

  const paymentUrl = getWorldnetConfig().paymentUrl

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-6 py-24 text-center">
        <p
          className="font-display text-[10px] font-semibold uppercase text-primary"
          style={{ letterSpacing: "0.18em" }}
        >
          Secure Payment
        </p>
        <h1 className="font-display text-3xl font-bold uppercase text-foreground">
          Redirecting To Worldnet
        </h1>
        <p className="text-sm text-muted-foreground">
          Your order is ready. We are opening Worldnet&apos;s hosted payment page now.
        </p>
        <form
          id="worldnet-hpp"
          action={paymentUrl}
          method="post"
          dangerouslySetInnerHTML={{
            __html: Object.entries(requestFields)
              .map(
                ([name, value]) =>
                  `<input type="hidden" name="${htmlEscape(name)}" value="${htmlEscape(String(value))}" />`,
              )
              .join("\n"),
          }}
        />
        <noscript>
          <button
            form="worldnet-hpp"
            type="submit"
            className="mx-auto border border-border px-4 py-2 text-xs font-bold uppercase text-foreground"
          >
            Continue To Payment
          </button>
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: 'document.getElementById("worldnet-hpp")?.submit();',
          }}
        />
      </div>
    </main>
  )
}
