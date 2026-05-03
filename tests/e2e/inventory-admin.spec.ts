import { expect, test } from "@playwright/test"

const ROCPAY_HEADERS = [
  "SKU",
  "DESCRIPTION",
  "CATEGORY",
  "QUANTITY",
  "UNITCOST",
  "TAXABLE",
  "INVENTORY",
  "IS_PINNED",
  "PINNED ORDER",
  "STATUS",
  "ITEMNAME",
  "UNIT OF MEASURE",
  "COMMODITY CODE",
]

type InventorySeedItem = {
  id: string
  itemType: string
  status: string
  name: string
  category?: string
  sku: string
  price: number
  quantity: number
  taxMode: string
  sourceSystem: string
  sourceId: string
  createdAt: string
  updatedAt: string
  images?: Array<{ key: string; url: string; order: number }>
}

async function resetInventory(request: import("@playwright/test").APIRequestContext) {
  await request.post("/api/e2e/inventory", {
    data: {
      action: "reset",
    },
  })
}

async function setInventory(
  request: import("@playwright/test").APIRequestContext,
  items: InventorySeedItem[],
) {
  await request.post("/api/e2e/inventory", {
    data: {
      action: "set",
      items,
    },
  })
}

function buildCsvRow(index: number) {
  const category =
    index % 6 === 0
      ? "Firearm"
      : index % 6 === 1
        ? "Ammo"
        : index % 6 === 2
          ? "APPAREL"
          : index % 6 === 3
            ? "Services"
            : index % 6 === 4
              ? "Parts"
              : "Other"

  return [
    `SKU-${index}`,
    `Description ${index}`,
    category,
    String((index % 5) + 1),
    (10 + index).toFixed(2),
    "Yes",
    "Yes",
    "NO",
    "-",
    "Active",
    `Item ${index}`,
    "",
    "",
  ].join(",")
}

test.beforeEach(async ({ request }) => {
  await resetInventory(request)
})

test("admin inventory import can create and display more than 100 rows", async ({
  page,
}) => {
  const csv = [ROCPAY_HEADERS.join(","), ...Array.from({ length: 132 }, (_, index) => buildCsvRow(index + 1))].join("\n")

  await page.goto("/admin/inventory")
  await page.getByRole("button", { name: "Import" }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: "RocPay_Inventory.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  })

  await expect(page.getByText("Loaded RocPay_Inventory.csv")).toBeVisible()
  await expect(page.getByText("Total rows")).toBeVisible()
  await expect(page.getByText("Valid rows")).toBeVisible()

  await page.getByRole("button", { name: /confirm import/i }).click()
  await expect(page.getByText("Import finished: 132 created, 0 updated, 0 skipped, 0 failed.")).toBeVisible()
  await expect(page.getByText("132 items total")).toBeVisible()
  await expect(page.getByText("132 of 132 items")).toBeVisible()
})

test("delete all clears the full inventory list", async ({ page, request }) => {
  const items = Array.from({ length: 132 }, (_, index) => ({
    id: `seed-${index + 1}`,
    itemType: "PART",
    status: "AVAILABLE",
    name: `Seed Item ${index + 1}`,
    category: "Parts",
    sku: `SEED-${index + 1}`,
    price: 20 + index,
    quantity: 1,
    taxMode: "DEFAULT",
    sourceSystem: "MANUAL",
    sourceId: `SEED-${index + 1}`,
    createdAt: "2026-05-02T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z",
  }))

  await setInventory(request, items)

  page.on("dialog", async (dialog) => {
    await dialog.accept()
  })

  await page.goto("/admin/inventory")
  await expect(page.getByText("132 items total")).toBeVisible()
  await page.getByRole("button", { name: "Delete All" }).click()
  await expect(page.getByText("Deleted all 132 inventory items.")).toBeVisible()
  await expect(page.getByText("0 items total")).toBeVisible()
})
