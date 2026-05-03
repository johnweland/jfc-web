import { expect, test } from "@playwright/test"

async function setInventory(
  request: import("@playwright/test").APIRequestContext,
  items: unknown[],
) {
  await request.post("/api/e2e/inventory", {
    data: {
      action: "set",
      items,
    },
  })
}

test("storefront falls back to placeholder.svg when an inventory image is broken", async ({
  page,
  request,
}) => {
  await setInventory(request, [
    {
      id: "broken-firearm-1",
      itemType: "FIREARM",
      status: "AVAILABLE",
      name: "Broken Rifle",
      category: "Firearm",
      sku: "BROKEN-RIFLE",
      price: 999,
      quantity: 3,
      taxMode: "DEFAULT",
      sourceSystem: "MANUAL",
      sourceId: "BROKEN-RIFLE",
      firearm: {
        firearmType: "RIFLE",
        requiresFflTransfer: true,
      },
      images: [
        {
          key: "",
          url: "/broken-image.jpg",
          order: 0,
        },
      ],
      createdAt: "2026-05-02T00:00:00.000Z",
      updatedAt: "2026-05-02T00:00:00.000Z",
    },
  ])

  await page.goto("/firearms")
  const image = page.getByRole("img", { name: "Broken Rifle" }).first()
  await expect(image).toBeVisible()
  await expect(image).toHaveAttribute("src", /placeholder\.svg|url=%2Fplaceholder\.svg/)
})
