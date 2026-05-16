import { describe, expect, it } from "vitest"

import { buildCartItemLineId } from "@/lib/cart/context"

describe("buildCartItemLineId", () => {
  it("distinguishes apparel variants with different sizes", () => {
    const medium = buildCartItemLineId({
      category: "apparel",
      slug: "logo-tee",
      sku: "TEE-BLK-M",
      size: "M",
      color: "Black",
    })
    const xl = buildCartItemLineId({
      category: "apparel",
      slug: "logo-tee",
      sku: "TEE-BLK-XL",
      size: "XL",
      color: "Black",
    })

    expect(medium).not.toBe(xl)
  })

  it("keeps simple parts stable without variant fields", () => {
    expect(
      buildCartItemLineId({
        category: "part",
        slug: "mlok-handguard-15",
        sku: "PRT-HG-MLOK-15",
      }),
    ).toBe("part::mlok-handguard-15::PRT-HG-MLOK-15::::")
  })
})
