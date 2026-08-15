import { describe, expect, it } from "vitest"

import {
  PUBLIC_INVENTORY_SELECTION,
  PUBLIC_LEGACY_INVENTORY_SELECTION,
} from "@/lib/inventory/selections"

const STAFF_ONLY_FIELDS = [
  "cost",
  "serialNumber",
  "sourceType",
  "location",
  "sourceId",
  "importBatchId",
  "sourceSystem",
  "rocPayItemId",
  "rocPayCategory",
  "rocPayRawImport",
  "fflSafeItemId",
  "fflSafeCategory",
  "fflSafeRawExport",
]

describe("public inventory selections", () => {
  it.each([
    ["current", PUBLIC_INVENTORY_SELECTION],
    ["legacy", PUBLIC_LEGACY_INVENTORY_SELECTION],
  ])("keeps staff-only fields out of the %s storefront query", (_name, selection) => {
    expect(selection).not.toEqual(expect.arrayContaining(STAFF_ONLY_FIELDS))
  })

  it("includes the fields needed to render and sell catalog items", () => {
    expect(PUBLIC_INVENTORY_SELECTION).toEqual(
      expect.arrayContaining([
        "id",
        "itemType",
        "title",
        "status",
        "quantity",
        "unitPrice",
        "taxMode",
        "images",
      ]),
    )
  })
})
