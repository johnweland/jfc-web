export type ProductCategory = "firearm" | "part" | "apparel";
export type FirearmType = "rifle" | "handgun" | "shotgun" | "receiver" | "other";
export type AvailabilityStatus =
  | "in_stock"
  | "low_stock"
  | "backordered"
  | "ffl_only";

interface BaseProduct {
  slug: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  status: AvailabilityStatus;
  category: ProductCategory;
  images: string[];
  description: string;
  featured?: boolean;
}

export interface Firearm extends BaseProduct {
  category: "firearm";
  type: FirearmType;
  series?: string;          // e.g. "Tactical Series / Long Range"
  serialTag?: string;       // display badge e.g. "JFC-2024-MKII"
  caliber: string;
  barrelLength: string;
  overallLength: string;
  weight: string;
  capacity: string;
  action: string;
  twistRate?: string;       // e.g. '1:8"'
  gasSystem?: string;       // e.g. "Carbine-Length DI"
  triggerType?: string;     // e.g. "Single-Stage, 6.5 lb"
  finish: string;
  requiresFFL: true;
  manufacturer: string;
}

export interface Part extends BaseProduct {
  category: "part";
  partType: string;
  compatibility: string[];
  requiresFFL: false;
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface ApparelVariant {
  id: string;
  size: string;
  color: string;
  colorHex?: string;
  sku?: string;
  quantity: number;
}

export interface Apparel extends BaseProduct {
  category: "apparel";
  apparelType: string;
  material: string;            // e.g. "Heavyweight Cotton, 6.5oz"
  sizes: string[];
  colorSwatches: ColorSwatch[];
  variants?: ApparelVariant[];
  requiresFFL: false;
}

export type Product = Firearm | Part | Apparel;
