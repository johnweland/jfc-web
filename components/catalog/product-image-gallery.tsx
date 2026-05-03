"use client"

import { useState } from "react"
import Image from "next/image"

export function ProductImageGallery({
  images,
  productName,
  emptyLabel,
}: {
  images: string[]
  productName: string
  emptyLabel: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
  const activeImage = images[activeIndex]
  const resolvedActiveImage =
    activeImage && !failedImages[activeImage] ? activeImage : "/placeholder.svg"
  const activeIsPlaceholder = resolvedActiveImage === "/placeholder.svg"

  function markImageFailed(image: string) {
    setFailedImages((current) => {
      if (current[image]) {
        return current
      }

      return {
        ...current,
        [image]: true,
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
        {resolvedActiveImage ? (
          <Image
            src={resolvedActiveImage}
            alt={productName}
            fill
            className={
              activeIsPlaceholder
                ? "absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                : "object-cover"
            }
            sizes="(max-width: 1024px) 100vw, 50vw"
            onError={() => activeImage && markImageFailed(activeImage)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="font-display text-sm uppercase text-muted-foreground/30 tracking-widest"
              style={{ letterSpacing: "0.2em" }}
            >
              {emptyLabel}
            </span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => {
            const thumbnailSrc = failedImages[image] ? "/placeholder.svg" : image
            const thumbnailIsPlaceholder = thumbnailSrc === "/placeholder.svg"

            return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-20 overflow-hidden bg-surface-container-low transition-opacity hover:opacity-100 ${
                index === activeIndex ? "outline outline-1 outline-primary" : "opacity-75"
              }`}
              aria-label={`Show image ${index + 1} for ${productName}`}
              aria-pressed={index === activeIndex}
            >
              <Image
                src={thumbnailSrc}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className={
                  thumbnailIsPlaceholder
                    ? "absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    : "object-cover"
                }
                sizes="80px"
                onError={() => markImageFailed(image)}
              />
            </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
