import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"
import outputs from "@/amplify_outputs.json"
import type { Schema } from "@/amplify/data/resource"
import { EMPTY_TAX_SETTINGS, TAX_SETTINGS_ID, type StoreTaxSettings } from "./shared"

function getPublicClient() {
  return generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies,
    authMode: "apiKey",
  })
}

export const getStoreTaxSettings = cache(async (): Promise<StoreTaxSettings> => {
  const client = getPublicClient()
  const { data, errors } = await client.models.TaxSettings.get({ id: TAX_SETTINGS_ID })

  if (errors?.length) {
    console.error("[tax/settings] getStoreTaxSettings errors", errors)
  }

  if (!data) {
    return EMPTY_TAX_SETTINGS
  }

  return {
    defaultRate: data.defaultRate ?? 0,
    categoryRates: {
      FIREARM: data.firearmRate ?? null,
      PART: data.partRate ?? null,
      ACCESSORY: data.accessoryRate ?? null,
      APPAREL: data.apparelRate ?? null,
      OTHER: data.otherRate ?? null,
    },
  }
})
