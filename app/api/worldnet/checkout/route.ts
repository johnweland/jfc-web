import { NextResponse } from "next/server"
import { requireSignedIn } from "@/lib/auth/server"
import { ONLINE_CHECKOUT_ENABLED } from "@/lib/commerce/config"
import { createWorldnetCheckoutSession } from "@/lib/worldnet/server"

export async function POST(request: Request) {
  if (!ONLINE_CHECKOUT_ENABLED) {
    return NextResponse.json(
      {
        code: "ONLINE_CHECKOUT_DISABLED",
        error: "Online checkout is not available. Visit Jackson Firearm Co. to complete your purchase.",
      },
      {
        status: 503,
        headers: {
          "cache-control": "no-store",
        },
      },
    )
  }

  await requireSignedIn("/checkout")

  try {
    const checkout = (await request.json()) as Parameters<
      typeof createWorldnetCheckoutSession
    >[0]
    const session = await createWorldnetCheckoutSession(checkout)

    return NextResponse.json(
      {
        orderNumber: session.orderNumber,
        redirectUrl: `/checkout/worldnet/redirect?order=${encodeURIComponent(session.orderNumber)}`,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout."

    console.error("[worldnet] checkout start failed", {
      message,
    })

    return NextResponse.json(
      {
        error: "Unable to start Worldnet checkout.",
        detail: message,
      },
      {
        status: 500,
        headers: {
          "cache-control": "no-store",
        },
      },
    )
  }
}
