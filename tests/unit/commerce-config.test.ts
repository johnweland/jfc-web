import { describe, expect, it } from "vitest"

import { isOnlineCheckoutEnabled } from "@/lib/commerce/config"

describe("online checkout configuration", () => {
  it.each([undefined, "", "false", "0", "yes"])(
    "keeps checkout disabled for %s",
    (value) => {
      expect(isOnlineCheckoutEnabled(value)).toBe(false)
    },
  )

  it.each(["true", "TRUE", " true "])("enables checkout only for %s", (value) => {
    expect(isOnlineCheckoutEnabled(value)).toBe(true)
  })
})
