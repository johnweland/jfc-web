"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { toAmplifyCreateInput, toAmplifyUpdateInput } from "@/lib/inventory/mapper";
import { getApparelSizeOptions, sortApparelSizes } from "@/lib/data/apparel-sizes";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  InventoryApparelVariant,
  InventoryItem,
  InventoryImage,
  InventoryItemType,
  InventoryStatus,
  InventorySource,
  InventoryTaxMode,
} from "@/lib/types/inventory";
import { ImageUploader } from "./image-uploader";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[10px] font-semibold uppercase text-muted-foreground"
      style={{ letterSpacing: "0.12em" }}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-surface-container-low">
      <CardHeader className="border-b border-border/40 pb-4">
        <CardTitle
          className="text-sm font-semibold uppercase text-foreground"
          style={{ letterSpacing: "0.1em" }}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

function createEmptyApparelVariant(): InventoryApparelVariant {
  return {
    id: crypto.randomUUID(),
    size: "",
    color: "",
    colorHex: "#1c1c1c",
    sku: "",
    quantity: 0,
  };
}

function getInitialApparelVariants(initialData?: InventoryItem): InventoryApparelVariant[] {
  const existingVariants = initialData?.apparel?.variants;
  if (existingVariants?.length) {
    return existingVariants;
  }

  if (initialData?.apparel?.size || initialData?.apparel?.color) {
    return [
      {
        id: crypto.randomUUID(),
        size: initialData.apparel.size ?? "",
        color: initialData.apparel.color ?? "",
        colorHex: "#1c1c1c",
        sku: initialData.sku ?? "",
        quantity: initialData.quantity,
      },
    ];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Form component
// ---------------------------------------------------------------------------

const client = generateClient<Schema>();

export function InventoryForm({
  initialData,
}: {
  initialData?: InventoryItem;
}) {
  const router = useRouter();
  const [itemId] = useState(() => initialData?.id ?? crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Basic Info
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [itemType, setItemType] = useState<InventoryItemType>(
    initialData?.itemType ?? "PART",
  );
  const [manufacturer, setManufacturer] = useState(
    initialData?.manufacturer ?? "",
  );
  const [brand, setBrand] = useState(initialData?.brand ?? "");
  const [model, setModel] = useState(initialData?.model ?? "");
  const [sourceSystem, setSourceSystem] = useState<InventorySource>(
    initialData?.sourceSystem ?? "MANUAL",
  );

  // Pricing & Identifiers
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [cost, setCost] = useState(initialData?.cost?.toString() ?? "");
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [upc, setUpc] = useState(initialData?.upc ?? "");
  const [taxMode, setTaxMode] = useState<InventoryTaxMode>(
    initialData?.taxMode ?? "DEFAULT",
  );
  const [customTaxRate, setCustomTaxRate] = useState(
    initialData?.customTaxRate?.toString() ?? "",
  );

  // Stock & Status
  const [quantity, setQuantity] = useState(
    initialData?.quantity?.toString() ?? "0",
  );
  const [status, setStatus] = useState<InventoryStatus>(
    initialData?.status ?? "DRAFT",
  );
  const [location, setLocation] = useState(initialData?.location ?? "");

  // Part fields
  const [partCategory, setPartCategory] = useState(initialData?.category ?? "")

  // Firearm fields
  const [serialNumber, setSerialNumber] = useState(
    initialData?.firearm?.serialNumber ?? "",
  );
  const [caliber, setCaliber] = useState(initialData?.firearm?.caliber ?? "");
  const [action, setAction] = useState(initialData?.firearm?.action ?? "");
  const [barrelLength, setBarrelLength] = useState(
    initialData?.firearm?.barrelLength ?? "",
  );
  const [capacity, setCapacity] = useState(
    initialData?.firearm?.capacity ?? "",
  );
  const [finish, setFinish] = useState(initialData?.firearm?.finish ?? "");
  const [firearmType, setFirearmType] = useState(
    initialData?.firearm?.firearmType ?? "",
  );
  const [requiresFflTransfer, setRequiresFflTransfer] = useState(
    initialData?.firearm?.requiresFflTransfer ?? true,
  );

  // Apparel fields
  const [apparelType, setApparelType] = useState(
    initialData?.apparel?.apparelType ?? "",
  );
  const [material, setMaterial] = useState(initialData?.apparel?.material ?? "");
  const [apparelVariants, setApparelVariants] = useState<InventoryApparelVariant[]>(
    () => getInitialApparelVariants(initialData),
  );
  const apparelSizeOptions = getApparelSizeOptions(
    apparelVariants.map((variant) => variant.size),
  );

  // Images
  const [images, setImages] = useState<InventoryImage[]>(
    initialData?.images ?? [],
  );

  // Derived: when APPAREL with variants, show the summed quantity without storing it in state
  const apparelTotalQuantity =
    itemType === "APPAREL" && apparelVariants.length > 0
      ? apparelVariants.reduce((sum, v) => sum + Math.max(0, v.quantity || 0), 0)
      : null;
  const displayQuantity =
    apparelTotalQuantity !== null ? apparelTotalQuantity.toString() : quantity;

  function updateApparelVariant(
    variantId: string,
    updates: Partial<InventoryApparelVariant>,
  ) {
    setApparelVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId ? { ...variant, ...updates } : variant,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const normalizedApparelVariants = apparelVariants.map((variant) => ({
      ...variant,
      size: variant.size.trim(),
      color: variant.color.trim(),
      colorHex: variant.colorHex?.trim() || undefined,
      sku: variant.sku?.trim() || undefined,
      quantity: Number.isFinite(variant.quantity) ? Math.max(0, variant.quantity) : 0,
    }));

    const actionableInvalidVariantIndex =
      itemType === "APPAREL"
        ? normalizedApparelVariants.findIndex((variant) => {
            const hasSize = Boolean(variant.size);
            const hasColor = Boolean(variant.color);
            const hasStockData = variant.quantity > 0 || Boolean(variant.sku);
            return (hasSize !== hasColor) && hasStockData;
          })
        : -1;

    if (actionableInvalidVariantIndex >= 0) {
      setSaveError(
        `Apparel variant ${actionableInvalidVariantIndex + 1} needs both a size and a color.`,
      );
      setSaving(false);
      return;
    }

    const cleanedApparelVariants = normalizedApparelVariants.filter(
      (variant) => Boolean(variant.size) && Boolean(variant.color),
    );

    const apparelQuantity =
      cleanedApparelVariants.length > 0
        ? cleanedApparelVariants.reduce((sum, variant) => sum + variant.quantity, 0)
        : parseInt(quantity) || 0;

    const apparelSizes = sortApparelSizes(
      cleanedApparelVariants.map((variant) => variant.size).filter(Boolean),
    );
    const apparelColors = Array.from(
      new Set(cleanedApparelVariants.map((variant) => variant.color).filter(Boolean)),
    );

    const payload: InventoryItem = {
      id: itemId,
      itemType,
      status,
      name,
      category: (itemType === "PART" || itemType === "ACCESSORY") ? (partCategory || undefined) : undefined,
      description: description || undefined,
      manufacturer: manufacturer || undefined,
      brand: brand || undefined,
      model: model || undefined,
      sku: sku || undefined,
      upc: upc || undefined,
      price: parseFloat(price) || 0,
      cost: cost ? parseFloat(cost) : undefined,
      taxMode,
      customTaxRate:
        taxMode === "CUSTOM" && customTaxRate
          ? parseFloat(customTaxRate)
          : undefined,
      quantity: itemType === "APPAREL" ? apparelQuantity : parseInt(quantity) || 0,
      location: location || undefined,
      sourceSystem,
      ...(itemType === "FIREARM" && {
        firearm: {
          serialNumber: serialNumber || undefined,
          caliber: caliber || undefined,
          action: action || undefined,
          barrelLength: barrelLength || undefined,
          capacity: capacity || undefined,
          finish: finish || undefined,
          firearmType: firearmType || undefined,
          requiresFflTransfer,
        },
      }),
      ...(itemType === "APPAREL" && {
        apparel: {
          apparelType: apparelType || undefined,
          material: material || undefined,
          size: apparelSizes.length > 0 ? apparelSizes.join(" / ") : undefined,
          color: apparelColors.length > 0 ? apparelColors.join(" / ") : undefined,
          variants:
            cleanedApparelVariants.length > 0 ? cleanedApparelVariants : undefined,
        },
      }),
      images: images.length > 0 ? images : undefined,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (initialData) {
        const { errors } = await client.models.InventoryItem.update(
          toAmplifyUpdateInput(payload)
        );
        if (errors?.length) throw new Error(errors[0].message);
      } else {
        const { errors } = await client.models.InventoryItem.create(
          toAmplifyCreateInput(payload)
        );
        if (errors?.length) throw new Error(errors[0].message);
      }
      router.push("/admin/inventory");
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Section 1: Basic Information */}
      <SectionCard title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name" required>
              Name
            </FieldLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="itemType" required>
              Category
            </FieldLabel>
            <Select
              value={itemType}
              onValueChange={(v) => setItemType(v as InventoryItemType)}
            >
              <SelectTrigger id="itemType" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ["FIREARM", "PART", "ACCESSORY", "APPAREL", "OTHER"] as const
                ).map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="sm:col-span-2">
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="manufacturer">Manufacturer</FieldLabel>
            <Input
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="brand">Brand</FieldLabel>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="model">Model</FieldLabel>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="sourceSystem" required>
              Source System
            </FieldLabel>
            <Select
              value={sourceSystem}
              onValueChange={(v) => setSourceSystem(v as InventorySource)}
            >
              <SelectTrigger id="sourceSystem" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["MANUAL", "ROCPAY", "FFLSAFE"] as const).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </SectionCard>

      {/* Section 2: Pricing & Identifiers */}
      <SectionCard title="Pricing & Identifiers">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="price" required>
              Price ($)
            </FieldLabel>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="h-9 font-mono"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="cost">Cost ($)</FieldLabel>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="h-9 font-mono"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="sku">SKU</FieldLabel>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="h-9 font-mono"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="upc">UPC</FieldLabel>
            <Input
              id="upc"
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              className="h-9 font-mono"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Section 3: Stock & Status */}
      <SectionCard title="Tax">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="taxMode" required>
              Tax Behavior
            </FieldLabel>
            <Select
              value={taxMode}
              onValueChange={(value) => setTaxMode(value as InventoryTaxMode)}
            >
              <SelectTrigger id="taxMode" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT" className="text-xs">
                  STORE DEFAULT
                </SelectItem>
                <SelectItem value="CATEGORY" className="text-xs">
                  CATEGORY RULE
                </SelectItem>
                <SelectItem value="CUSTOM" className="text-xs">
                  CUSTOM RATE
                </SelectItem>
                <SelectItem value="EXEMPT" className="text-xs">
                  TAX EXEMPT
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Use the combined store default, a category rule, a custom item rate, or exempt this item.
            </p>
          </Field>

          <Field>
            <FieldLabel htmlFor="customTaxRate">
              Custom Tax Rate (%)
            </FieldLabel>
            <Input
              id="customTaxRate"
              type="number"
              min="0"
              step="0.001"
              value={customTaxRate}
              onChange={(e) => setCustomTaxRate(e.target.value)}
              disabled={taxMode !== "CUSTOM"}
              placeholder={taxMode === "CUSTOM" ? "e.g. 7.500" : "Only used for custom tax"}
              className="h-9 font-mono"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Section 4: Stock & Status */}
      <SectionCard title="Stock & Status">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="quantity" required>
              Quantity
            </FieldLabel>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="1"
              value={displayQuantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={apparelTotalQuantity !== null}
              className="h-9 font-mono"
            />
            {apparelTotalQuantity !== null && (
              <p className="text-xs text-muted-foreground">
                Auto-calculated from apparel variants below.
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="status" required>
              Status
            </FieldLabel>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as InventoryStatus)}
            >
              <SelectTrigger id="status" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "DRAFT",
                    "AVAILABLE",
                    "RESERVED",
                    "SOLD",
                    "ARCHIVED",
                  ] as const
                ).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. RACK-A1, CASE-B2"
              className="h-9 font-mono"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Section 5a: Part Details (conditional) */}
      {(itemType === "PART" || itemType === "ACCESSORY") && (
        <SectionCard title="Part Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="partCategory">Part Category</FieldLabel>
              <Select value={partCategory} onValueChange={setPartCategory}>
                <SelectTrigger id="partCategory" className="h-9">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Optic",
                    "Magazine",
                    "Handguard",
                    "Stock / Brace",
                    "BCG",
                    "Trigger",
                    "Muzzle Device",
                    "Grip",
                    "Upper Receiver",
                    "Barrel",
                    "Buffer / Spring",
                    "Sling / Mount",
                    "Light / Laser",
                    "Build Kit",
                    "Other",
                  ].map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SectionCard>
      )}

      {/* Section 5b: Firearm Details (conditional) */}
      {itemType === "FIREARM" && (
        <SectionCard title="Firearm Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="serialNumber">Serial Number</FieldLabel>
              <Input
                id="serialNumber"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="h-9 font-mono"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="firearmType">Firearm Type</FieldLabel>
              <Select value={firearmType} onValueChange={setFirearmType}>
                <SelectTrigger id="firearmType" className="h-9">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "HANDGUN",
                    "RIFLE",
                    "SHOTGUN",
                    "RECEIVER",
                    "NFA",
                    "OTHER",
                  ].map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="caliber">Caliber</FieldLabel>
              <Input
                id="caliber"
                value={caliber}
                onChange={(e) => setCaliber(e.target.value)}
                placeholder="e.g. 9mm Luger, 5.56 NATO"
                className="h-9"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="action">Action</FieldLabel>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger id="action" className="h-9">
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Semi-Auto",
                    "Bolt-Action",
                    "Pump",
                    "Lever-Action",
                    "Single-Shot",
                    "Revolver",
                    "Full-Auto",
                  ].map((a) => (
                    <SelectItem key={a} value={a} className="text-xs">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="barrelLength">Barrel Length</FieldLabel>
              <Input
                id="barrelLength"
                value={barrelLength}
                onChange={(e) => setBarrelLength(e.target.value)}
                placeholder='e.g. 16"'
                className="h-9"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
              <Input
                id="capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 15+1"
                className="h-9"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="finish">Finish</FieldLabel>
              <Input
                id="finish"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                placeholder="e.g. Matte Black, FDE Cerakote"
                className="h-9"
              />
            </Field>

            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <Checkbox
                id="requiresFfl"
                checked={requiresFflTransfer}
                onCheckedChange={(v) => setRequiresFflTransfer(!!v)}
              />
              <Label
                htmlFor="requiresFfl"
                className="text-sm text-foreground cursor-pointer"
              >
                Requires FFL Transfer
              </Label>
            </div>
          </div>
        </SectionCard>
      )}

      {itemType === "APPAREL" && (
        <SectionCard title="Apparel Details">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="apparelType">Apparel Type</FieldLabel>
                <Select value={apparelType} onValueChange={setApparelType}>
                  <SelectTrigger id="apparelType" className="h-9">
                    <SelectValue placeholder="Select apparel type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["Shirt", "Hat", "Hoodie", "Accessory"].map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="material">Material</FieldLabel>
                <Input
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. Heavyweight Cotton, 6.5oz"
                  className="h-9"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase text-muted-foreground"
                  style={{ letterSpacing: "0.12em" }}
                >
                  Variants
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add one row per size/color combination. Total quantity is summed
                  from these rows.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="font-semibold uppercase text-xs"
                style={{ letterSpacing: "0.08em" }}
                onClick={() =>
                  setApparelVariants((prev) => [...prev, createEmptyApparelVariant()])
                }
              >
                <Plus className="size-3.5" />
                ADD VARIANT
              </Button>
            </div>

            {apparelVariants.length === 0 ? (
              <div className="border border-dashed border-border/40 px-4 py-5 text-sm text-muted-foreground">
                No variants added yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {apparelVariants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className="grid gap-3 border border-border/40 bg-background/30 p-3 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-2">
                      <Field>
                        <FieldLabel htmlFor={`variant-size-${variant.id}`} required>
                          Size
                        </FieldLabel>
                        <Select
                          value={variant.size}
                          onValueChange={(value) =>
                            updateApparelVariant(variant.id, { size: value })
                          }
                        >
                          <SelectTrigger
                            id={`variant-size-${variant.id}`}
                            className="h-9"
                          >
                            <SelectValue placeholder="Select size..." />
                          </SelectTrigger>
                          <SelectContent>
                            {apparelSizeOptions.map((size) => (
                              <SelectItem key={size} value={size} className="text-xs">
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <div className="sm:col-span-3">
                      <Field>
                        <FieldLabel htmlFor={`variant-color-${variant.id}`} required>
                          Color
                        </FieldLabel>
                        <Input
                          id={`variant-color-${variant.id}`}
                          value={variant.color}
                          onChange={(e) =>
                            updateApparelVariant(variant.id, { color: e.target.value })
                          }
                          placeholder="Black"
                          className="h-9"
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <Field>
                        <FieldLabel htmlFor={`variant-hex-${variant.id}`}>
                          Swatch
                        </FieldLabel>
                        <Input
                          id={`variant-hex-${variant.id}`}
                          type="color"
                          value={variant.colorHex ?? "#1c1c1c"}
                          onChange={(e) =>
                            updateApparelVariant(variant.id, {
                              colorHex: e.target.value,
                            })
                          }
                          className="h-9 p-1"
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-3">
                      <Field>
                        <FieldLabel htmlFor={`variant-sku-${variant.id}`}>
                          Variant SKU
                        </FieldLabel>
                        <Input
                          id={`variant-sku-${variant.id}`}
                          value={variant.sku ?? ""}
                          onChange={(e) =>
                            updateApparelVariant(variant.id, { sku: e.target.value })
                          }
                          placeholder="Optional"
                          className="h-9 font-mono"
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-1">
                      <Field>
                        <FieldLabel htmlFor={`variant-qty-${variant.id}`}>
                          Qty
                        </FieldLabel>
                        <Input
                          id={`variant-qty-${variant.id}`}
                          type="number"
                          min="0"
                          step="1"
                          value={variant.quantity.toString()}
                          onChange={(e) =>
                            updateApparelVariant(variant.id, {
                              quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="h-9 font-mono"
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-full text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setApparelVariants((prev) =>
                            prev.filter((entry) => entry.id !== variant.id),
                          )
                        }
                        aria-label={`Remove apparel variant ${index + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Section 5: Images */}
      <SectionCard title="Images">
        <ImageUploader
          itemId={itemId}
          images={images}
          onChange={setImages}
        />
        <p
          className="mt-3 text-[10px] text-muted-foreground/60 uppercase"
          style={{ letterSpacing: "0.08em" }}
        >
          First image is used as the primary / hero image on product pages.
        </p>
      </SectionCard>

      {/* Action bar */}
      <div className="flex flex-col gap-3 pt-2 border-t border-border/40">
        {saveError && (
          <p
            className="text-[11px] text-destructive uppercase"
            style={{ letterSpacing: "0.08em" }}
          >
            {saveError}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="font-semibold uppercase text-xs"
            asChild
            disabled={saving}
          >
            <Link href="/admin/inventory" style={{ letterSpacing: "0.08em" }}>
              CANCEL
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="gradient-primary text-primary-foreground font-semibold uppercase text-xs"
            style={{ letterSpacing: "0.08em" }}
          >
            {saving ? "SAVING..." : initialData ? "SAVE CHANGES" : "CREATE ITEM"}
          </Button>
        </div>
      </div>
    </form>
  );
}
