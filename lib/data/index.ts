export * from "./types";
export { firearms } from "./firearms";
export { parts } from "./parts";
export { apparel } from "./apparel";
export { fflInfoPageContent } from "./ffl-info";

import type { Product, ProductCategory } from "./types";
import { firearms } from "./firearms";
import { parts } from "./parts";
import { apparel } from "./apparel";

export function getAllProducts(): Product[] {
  return [...firearms, ...parts, ...apparel];
}

export function getFeaturedProducts(): Product[] {
  return getAllProducts().filter((p) => p.featured);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return getAllProducts().filter((p) => p.category === category);
}

export function getProductBySlug(
  slug: string,
  category?: ProductCategory
): Product | undefined {
  const products = category ? getProductsByCategory(category) : getAllProducts();
  return products.find((p) => p.slug === slug);
}
