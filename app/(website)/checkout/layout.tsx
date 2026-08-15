import { redirect } from "next/navigation"
import { ONLINE_CHECKOUT_ENABLED } from "@/lib/commerce/config"

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  if (!ONLINE_CHECKOUT_ENABLED) {
    redirect("/cart")
  }

  return children
}
