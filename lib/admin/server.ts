import "server-only"

import { cookies } from "next/headers"
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data"

import type { Schema } from "@/amplify/data/resource"
import { amplifyOutputs } from "@/lib/auth/amplify-server"
import {
  ADMIN_CUSTOMER_ADDRESS_SELECTION,
  ADMIN_CUSTOMER_FFL_SELECTION,
  ADMIN_CUSTOMER_PROFILE_SELECTION,
  ADMIN_LIST_LIMIT,
  ADMIN_ORDER_SELECTION,
  buildAdminCustomers,
  buildAdminOrders,
  type CustomerAddressRecord,
  type CustomerFflLocationRecord,
  type CustomerProfileRecord,
  type OrderRecord,
} from "@/lib/admin/shared"

function getAdminClient() {
  return generateServerClientUsingCookies<Schema>({
    config: amplifyOutputs,
    cookies,
    authMode: "userPool",
  })
}

async function listAllModelRecords<T>({
  list,
  selectionSet,
}: {
  list: (args: {
    limit: number
    nextToken?: string | null
    selectionSet: readonly string[]
  }) => Promise<unknown>
  selectionSet: readonly string[]
}) {
  const records: T[] = []
  let nextToken: string | null | undefined = undefined

  do {
    const response = (await list({
      limit: ADMIN_LIST_LIMIT,
      nextToken,
      selectionSet,
    })) as {
      data?: T[]
      errors?: readonly { message: string }[]
      nextToken?: string | null
    }

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(" "))
    }

    records.push(...(response.data ?? []))
    nextToken = response.nextToken
  } while (nextToken)

  return records
}

export async function loadAdminOrders() {
  const client = getAdminClient()
  const [profiles, orders] = await Promise.all([
    listAllModelRecords<CustomerProfileRecord>({
      list: client.models.CustomerProfile.list as unknown as (args: {
        limit: number
        nextToken?: string | null
        selectionSet: readonly string[]
      }) => Promise<unknown>,
      selectionSet: ADMIN_CUSTOMER_PROFILE_SELECTION,
    }),
    listAllModelRecords<OrderRecord>({
      list: client.models.Order.list as unknown as (args: {
        limit: number
        nextToken?: string | null
        selectionSet: readonly string[]
      }) => Promise<unknown>,
      selectionSet: ADMIN_ORDER_SELECTION,
    }),
  ])

  return buildAdminOrders(orders, profiles)
}

export async function loadAdminCustomers() {
  const client = getAdminClient()
  const [profiles, addresses, fflLocations, orders] = await Promise.all([
    listAllModelRecords<CustomerProfileRecord>({
      list: client.models.CustomerProfile.list as unknown as (args: {
        limit: number
        nextToken?: string | null
        selectionSet: readonly string[]
      }) => Promise<unknown>,
      selectionSet: ADMIN_CUSTOMER_PROFILE_SELECTION,
    }),
    listAllModelRecords<CustomerAddressRecord>({
      list: client.models.CustomerAddress.list as unknown as (args: {
        limit: number
        nextToken?: string | null
        selectionSet: readonly string[]
      }) => Promise<unknown>,
      selectionSet: ADMIN_CUSTOMER_ADDRESS_SELECTION,
    }),
    listAllModelRecords<CustomerFflLocationRecord>({
      list: client.models.CustomerFflLocation.list as unknown as (args: {
        limit: number
        nextToken?: string | null
        selectionSet: readonly string[]
      }) => Promise<unknown>,
      selectionSet: ADMIN_CUSTOMER_FFL_SELECTION,
    }),
    listAllModelRecords<OrderRecord>({
      list: client.models.Order.list as unknown as (args: {
        limit: number
        nextToken?: string | null
        selectionSet: readonly string[]
      }) => Promise<unknown>,
      selectionSet: ADMIN_ORDER_SELECTION,
    }),
  ])

  return buildAdminCustomers(profiles, addresses, fflLocations, orders)
}
