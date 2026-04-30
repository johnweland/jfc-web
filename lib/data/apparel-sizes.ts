export const APPAREL_STANDARD_SIZE_OPTIONS = [
  "SM",
  "MD",
  "LG",
  "XL",
  "2XL",
  "3XL",
] as const;

export const DEFAULT_APPAREL_SIZE = "One Size" as const;

export const APPAREL_SIZE_OPTIONS = [
  ...APPAREL_STANDARD_SIZE_OPTIONS,
  DEFAULT_APPAREL_SIZE,
] as const;

export type ApparelSize = (typeof APPAREL_SIZE_OPTIONS)[number];

const APPAREL_SIZE_ORDER = new Map(
  APPAREL_SIZE_OPTIONS.map((size, index) => [size, index]),
);

function normalizeApparelSizes(sizes: readonly string[]) {
  return Array.from(
    new Set(
      sizes
        .map((size) => size.trim())
        .filter(Boolean),
    ),
  );
}

export function getApparelSizeOptions(additionalSizes: readonly string[] = []) {
  return normalizeApparelSizes([...APPAREL_SIZE_OPTIONS, ...additionalSizes]).sort(
    (left, right) => {
      const leftOrder = APPAREL_SIZE_ORDER.get(left);
      const rightOrder = APPAREL_SIZE_ORDER.get(right);

      if (leftOrder !== undefined && rightOrder !== undefined) {
        return leftOrder - rightOrder;
      }

      if (leftOrder !== undefined) {
        return -1;
      }

      if (rightOrder !== undefined) {
        return 1;
      }

      return left.localeCompare(right);
    },
  );
}

export function sortApparelSizes(sizes: readonly string[]) {
  return getApparelSizeOptions(sizes).filter((size) => sizes.includes(size));
}
