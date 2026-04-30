import "server-only"

import { cookies } from "next/headers"
import { getUrl } from "aws-amplify/storage/server"
import { runWithAmplifyServerContext } from "@/lib/auth/amplify-server"
import type { InventoryImage } from "@/lib/types/inventory"

export async function refreshInventoryImages(
  images?: InventoryImage[],
): Promise<InventoryImage[] | undefined> {
  if (!images?.length) {
    return images
  }

  return Promise.all(
    images.map(async (image) => {
      if (!image.key) {
        return image
      }

      try {
        const result = await runWithAmplifyServerContext({
          nextServerContext: { cookies },
          operation: (contextSpec) =>
            getUrl(contextSpec, {
              path: image.key,
              options: { expiresIn: 3600 },
            }),
        })

        return {
          ...image,
          url: result.url.toString(),
        }
      } catch {
        return image
      }
    }),
  )
}
