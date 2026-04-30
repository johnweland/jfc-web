"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Loader2, Trash2, Upload, ArrowUp, ArrowDown, ImageOff } from "lucide-react"
import { uploadData, remove, getUrl } from "aws-amplify/storage"
import { Button } from "@/components/ui/button"
import type { InventoryImage } from "@/lib/types/inventory"

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif,image/avif"
const ALLOWED_TYPES = new Set(ACCEPTED.split(","))
const MAX_MB = 10

interface Props {
  itemId: string
  images: InventoryImage[]
  onChange: React.Dispatch<React.SetStateAction<InventoryImage[]>>
}

interface UploadingFile {
  name: string
  progress: "uploading" | "error"
  error?: string
}

export function ImageUploader({ itemId, images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<UploadingFile[]>([])

  // ---------------------------------------------------------------------------
  // Upload — Amplify handles pre-signing and IAM auth via Cognito automatically
  // ---------------------------------------------------------------------------

  async function uploadFile(file: File) {
    if (!ALLOWED_TYPES.has(file.type)) {
      markError(file.name, "File type not allowed")
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      markError(file.name, `Exceeds ${MAX_MB} MB limit`)
      return
    }

    setUploading((prev) => [...prev, { name: file.name, progress: "uploading" }])

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const path = `inventory/${itemId}/${crypto.randomUUID()}.${ext}`

      // Upload directly to S3 via Amplify (no separate API route needed —
      // Amplify uses the Cognito identity to get temporary AWS credentials
      // and pre-signs the PUT internally)
      await uploadData({ path, data: file, options: { contentType: file.type } }).result

      // Get a URL for immediate display; for long-term storage the path (key)
      // is what matters — getUrl can re-derive it at display time
      const { url } = await getUrl({ path, options: { expiresIn: 3600 } })

      onChange((prev) => [
        ...prev,
        { key: path, url: url.toString(), order: prev.length },
      ])
    } catch (err) {
      markError(file.name, err instanceof Error ? err.message : "Upload failed")
      return
    }

    clearUploading(file.name)
  }

  function markError(name: string, error: string) {
    setUploading((prev) =>
      prev.map((f) => (f.name === name ? { ...f, progress: "error", error } : f))
    )
  }

  function clearUploading(name: string) {
    setUploading((prev) => prev.filter((f) => f.name !== name))
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(uploadFile)
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDelete(image: InventoryImage) {
    try {
      await remove({ path: image.key })
    } catch (err) {
      // Log but still remove from UI — S3 object can be cleaned up manually
      console.error("[ImageUploader] delete error:", err)
    }

    onChange((prev) =>
      prev
        .filter((img) => img.key !== image.key)
        .map((img, i) => ({ ...img, order: i }))
    )
  }

  // ---------------------------------------------------------------------------
  // Reorder
  // ---------------------------------------------------------------------------

  function move(index: number, direction: "up" | "down") {
    const next = [...images]
    const swap = direction === "up" ? index - 1 : index + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    onChange(next.map((img, i) => ({ ...img, order: i })))
  }

  // ---------------------------------------------------------------------------
  // Drop zone
  // ---------------------------------------------------------------------------

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const isUploading = uploading.some((f) => f.progress === "uploading")
  const hasErrors = uploading.some((f) => f.progress === "error")

  return (
    <div className="flex flex-col gap-4">
      {/* Existing images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.key}
              className="group relative border border-border/40 bg-surface-container overflow-hidden"
            >
              {index === 0 && (
                <span
                  className="absolute top-1.5 left-1.5 z-10 bg-primary text-primary-foreground text-[9px] font-bold uppercase px-1.5 py-0.5"
                  style={{ letterSpacing: "0.1em" }}
                >
                  PRIMARY
                </span>
              )}

              <div className="relative aspect-square w-full">
                <Image
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>

              {/* Controls on hover */}
              <div className="absolute inset-0 flex flex-col items-end justify-between p-1.5 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 bg-destructive/20 hover:bg-destructive/40 text-destructive"
                  onClick={() => handleDelete(image)}
                  title="Delete image"
                >
                  <Trash2 className="size-3" />
                </Button>

                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => move(index, "up")}
                    disabled={index === 0}
                    title="Move earlier"
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => move(index, "down")}
                    disabled={index === images.length - 1}
                    title="Move later"
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && uploading.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 border border-border/30 border-dashed py-10 text-center">
          <ImageOff className="size-8 text-muted-foreground/30" />
          <p
            className="text-[10px] font-semibold uppercase text-muted-foreground/50"
            style={{ letterSpacing: "0.12em" }}
          >
            No images uploaded
          </p>
        </div>
      )}

      {/* In-progress / error rows */}
      {uploading.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploading.map((f) => (
            <div
              key={f.name}
              className={`flex items-center justify-between px-3 py-2 border text-xs ${
                f.progress === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border/30 bg-surface-container text-muted-foreground"
              }`}
            >
              <span className="truncate max-w-[200px]">{f.name}</span>
              <span className="flex items-center gap-2 shrink-0">
                {f.progress === "uploading" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    {f.error}
                    <button
                      type="button"
                      onClick={() => clearUploading(f.name)}
                      className="text-destructive/70 hover:text-destructive ml-1"
                    >
                      ×
                    </button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className="flex flex-col items-center justify-center gap-3 border border-border/30 border-dashed py-8 cursor-pointer hover:border-primary/50 hover:bg-surface-container/30 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="Upload images"
      >
        {isUploading ? (
          <Loader2 className="size-5 text-primary animate-spin" />
        ) : (
          <Upload className="size-5 text-muted-foreground/50" />
        )}
        <div className="flex flex-col items-center gap-1">
          <p
            className="text-[10px] font-semibold uppercase text-muted-foreground"
            style={{ letterSpacing: "0.12em" }}
          >
            {isUploading ? "UPLOADING..." : "DROP FILES OR CLICK TO UPLOAD"}
          </p>
          <p className="text-[10px] text-muted-foreground/50">
            JPEG, PNG, WEBP, AVIF — max {MAX_MB} MB each
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {hasErrors && (
        <p
          className="text-[10px] text-destructive uppercase"
          style={{ letterSpacing: "0.08em" }}
        >
          Some uploads failed. Check errors above and retry.
        </p>
      )}
    </div>
  )
}
