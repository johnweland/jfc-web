import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"
import type { Schema } from "@/amplify/data/resource"
import { amplifyOutputs } from "@/lib/auth/amplify-server"
import {
  EMPTY_TAX_SETTINGS,
  TAX_SETTINGS_ID,
  getDefaultTaxRate,
  type StoreTaxSettings,
} from "./shared"

const LEGACY_TAX_SETTINGS_SELECTION = [
  "id",
  "defaultRate",
  "firearmRate",
  "partRate",
  "accessoryRate",
  "apparelRate",
  "otherRate",
] as const

function hasLegacyTaxFieldReadError(errors: readonly { message: string }[] | undefined) {
  return Boolean(
    errors?.some(
      (error) =>
        error.message.includes("/getTaxSettings/stateRate") ||
        error.message.includes("/getTaxSettings/localRate") ||
        error.message.includes("/getTaxSettings/firearmExempt") ||
        error.message.includes("/getTaxSettings/partExempt") ||
        error.message.includes("/getTaxSettings/accessoryExempt") ||
        error.message.includes("/getTaxSettings/apparelExempt") ||
        error.message.includes("/getTaxSettings/otherExempt"),
    ),
  )
}

function getPublicClient() {
  return generateServerClientUsingCookies<Schema>({
    config: amplifyOutputs,
    cookies,
    authMode: "apiKey",
  })
}

export const getStoreTaxSettings = cache(async (): Promise<StoreTaxSettings> => {
  const client = getPublicClient()
  const primary = await client.models.TaxSettings.get({ id: TAX_SETTINGS_ID })

  if (primary.errors?.length && !hasLegacyTaxFieldReadError(primary.errors)) {
    console.error("[tax/settings] getStoreTaxSettings errors", primary.errors)
  }

  if (!hasLegacyTaxFieldReadError(primary.errors)) {
    if (!primary.data) {
      return EMPTY_TAX_SETTINGS
    }

    const stateRate = primary.data.stateRate ?? primary.data.defaultRate ?? 0
    const localRate = primary.data.localRate ?? 0

    return {
      stateRate,
      localRate,
      defaultRate: getDefaultTaxRate(stateRate, localRate),
      categoryRates: {
        FIREARM: primary.data.firearmRate ?? null,
        PART: primary.data.partRate ?? null,
        ACCESSORY: primary.data.accessoryRate ?? null,
        APPAREL: primary.data.apparelRate ?? null,
        OTHER: primary.data.otherRate ?? null,
        SERVICES: primary.data.serviceRate ?? null,
        AMMUNITION: primary.data.ammunitionRate ?? null,
      },
      categoryExemptions: {
        FIREARM: primary.data.firearmExempt ?? false,
        PART: primary.data.partExempt ?? false,
        ACCESSORY: primary.data.accessoryExempt ?? false,
        APPAREL: primary.data.apparelExempt ?? false,
        OTHER: primary.data.otherExempt ?? false,
        SERVICES: primary.data.serviceExempt ?? false,
        AMMUNITION: primary.data.ammunitionExempt ?? false,
      },
    }
  }

  const legacy = await client.models.TaxSettings.get(
    { id: TAX_SETTINGS_ID },
    { selectionSet: LEGACY_TAX_SETTINGS_SELECTION },
  )

  if (legacy.errors?.length) {
    console.error("[tax/settings] getStoreTaxSettings legacy fallback errors", legacy.errors)
  }

  if (!legacy.data) {
    return EMPTY_TAX_SETTINGS
  }

  const stateRate = legacy.data.defaultRate ?? 0
  const localRate = 0

  return {
    stateRate,
    localRate,
    defaultRate: getDefaultTaxRate(stateRate, localRate),
    categoryRates: {
      FIREARM: legacy.data.firearmRate ?? null,
      PART: legacy.data.partRate ?? null,
      ACCESSORY: legacy.data.accessoryRate ?? null,
      APPAREL: legacy.data.apparelRate ?? null,
      OTHER: legacy.data.otherRate ?? null,
      SERVICES: null,
      AMMUNITION: null,
    },
    categoryExemptions: {
      FIREARM: false,
      PART: false,
      ACCESSORY: false,
      APPAREL: false,
      OTHER: false,
      SERVICES: false,
      AMMUNITION: false,
    },
  }
})
