export function isOnlineCheckoutEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true"
}

/**
 * Online checkout is deliberately opt-in while the POS/payment integration is
 * incomplete. Set NEXT_PUBLIC_ONLINE_CHECKOUT_ENABLED=true and redeploy only
 * when both the checkout UI and server payment flow are ready for customers.
 */
export const ONLINE_CHECKOUT_ENABLED = isOnlineCheckoutEnabled(
  process.env.NEXT_PUBLIC_ONLINE_CHECKOUT_ENABLED,
)
