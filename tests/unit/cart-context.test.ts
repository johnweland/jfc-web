import { afterEach, describe, expect, it, vi } from "vitest"

import {
  buildCartItemLineId,
  loadCartFromStorage,
  saveCartToStorage,
  type CartItem,
} from "@/lib/cart/context"

const STORAGE_KEY = "jfc-cart"

function installLocalStorage() {
  const store = new Map<string, string>()

  vi.stubGlobal("window", {})
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
  })

  return store
}

afterEach(() => {
  vi.unstubAllGlobals()
})

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

  it("round-trips valid cart items through localStorage", () => {
    const store = installLocalStorage()
    const item: CartItem = {
      lineId: "part::mlok-handguard-15::PRT-HG-MLOK-15::::",
      slug: "mlok-handguard-15",
      name: "M-LOK Handguard 15",
      sku: "PRT-HG-MLOK-15",
      price: 149.99,
      category: "part",
      taxRate: 0.07,
      requiresFFL: false,
      quantity: 2,
    }

    saveCartToStorage([item])

    expect(store.has(STORAGE_KEY)).toBe(true)
    expect(loadCartFromStorage()).toEqual([item])
  })

  it("ignores malformed stored cart data", () => {
    const store = installLocalStorage()
    store.set(
      STORAGE_KEY,
      JSON.stringify([
        { lineId: "missing-fields" },
        {
          lineId: "apparel::logo-tee::TEE-BLK-M::M::Black",
          slug: "logo-tee",
          name: "Logo Tee",
          sku: "TEE-BLK-M",
          price: 32,
          category: "apparel",
          taxRate: 0.07,
          requiresFFL: false,
          quantity: 1,
          size: "M",
          color: "Black",
        },
      ]),
    )

    expect(loadCartFromStorage()).toHaveLength(1)
  })

  it("removes storage when saving an empty cart", () => {
    const store = installLocalStorage()
    store.set(STORAGE_KEY, "[]")

    saveCartToStorage([])

    expect(store.has(STORAGE_KEY)).toBe(false)
  })
})
