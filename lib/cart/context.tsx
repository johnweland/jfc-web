"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { calculateTaxAmount } from "@/lib/tax/shared";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  lineId: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  category: "firearm" | "part" | "apparel";
  imageUrl?: string;
  maxQuantity?: number;
  taxRate: number;
  requiresFFL: boolean;
  quantity: number;
  /** Apparel only */
  size?: string;
  /** Apparel only */
  color?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type Action =
  | { type: "ADD"; payload: Omit<CartItem, "quantity"> & { quantity?: number } }
  | { type: "REMOVE"; lineId: string }
  | { type: "SET_QTY"; lineId: string; quantity: number }
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "CLEAR" };

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function buildCartItemLineId(
  item: Pick<CartItem, "slug" | "sku" | "size" | "color" | "category">,
) {
  return [item.category, item.slug, item.sku, item.size ?? "", item.color ?? ""].join("::")
}

function clampQuantity(quantity: number, maxQuantity?: number) {
  if (maxQuantity == null) {
    return Math.max(1, quantity)
  }
  if (maxQuantity < 1) {
    return 0
  }

  return Math.max(1, Math.min(quantity, maxQuantity))
}

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD": {
      const { quantity = 1, ...item } = action.payload;
      // Block adds when availability is explicitly 0 — covers serialized items
      // with no AVAILABLE units (derived) and non-serialized items at qty 0.
      if (typeof item.maxQuantity === "number" && item.maxQuantity < 1) {
        return state
      }
      const existing = state.items.find((i) => i.lineId === item.lineId);
      if (existing) {
        const nextQuantity = clampQuantity(
          existing.quantity + quantity,
          item.maxQuantity ?? existing.maxQuantity,
        )
        return {
          ...state,
          isOpen: true,
          items: state.items.map((i) =>
            i.lineId === item.lineId
              ? {
                  ...i,
                  ...item,
                  maxQuantity: item.maxQuantity ?? i.maxQuantity,
                  quantity: nextQuantity,
                }
              : i
          ),
        };
      }
      return {
        ...state,
        isOpen: true,
        items: [
          ...state.items,
          { ...item, quantity: clampQuantity(quantity, item.maxQuantity) },
        ],
      };
    }
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((i) => i.lineId !== action.lineId),
      };
    case "SET_QTY": {
      if (action.quantity < 1) {
        return {
          ...state,
          items: state.items.filter((i) => i.lineId !== action.lineId),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.lineId === action.lineId
            ? { ...i, quantity: clampQuantity(action.quantity, i.maxQuantity) }
            : i
        ),
      };
    }
    case "HYDRATE":
      return {
        ...state,
        items: action.items,
      };
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = "jfc-cart";

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<CartItem>;

  return (
    typeof item.lineId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.sku === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    (item.category === "firearm" || item.category === "part" || item.category === "apparel") &&
    typeof item.taxRate === "number" &&
    Number.isFinite(item.taxRate) &&
    typeof item.requiresFFL === "boolean" &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0
  );
}

function sanitizeStoredCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isCartItem)
    .map((item) => ({
      ...item,
      quantity: clampQuantity(item.quantity, item.maxQuantity),
    }))
    .filter((item) => item.quantity > 0);
}

export function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeStoredCartItems(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage can be unavailable in private browsing or locked-down contexts.
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  estimatedTax: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
  const [hydrated, markHydrated] = useReducer(() => true, false);

  useEffect(() => {
    const stored = loadCartFromStorage();

    if (stored.length > 0) {
      dispatch({ type: "HYDRATE", items: stored });
    }

    markHydrated();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveCartToStorage(state.items);
  }, [hydrated, state.items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) =>
      dispatch({ type: "ADD", payload: item }),
    []
  );
  const removeItem = useCallback(
    (lineId: string) => dispatch({ type: "REMOVE", lineId }),
    []
  );
  const setQuantity = useCallback(
    (lineId: string, quantity: number) =>
      dispatch({ type: "SET_QTY", lineId, quantity }),
    []
  );
  const openCart = useCallback(() => dispatch({ type: "OPEN" }), []);
  const closeCart = useCallback(() => dispatch({ type: "CLOSE" }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const estimatedTax = state.items.reduce(
    (sum, i) => sum + calculateTaxAmount(i.price * i.quantity, i.taxRate ?? 0),
    0,
  );
  const total = subtotal + estimatedTax;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        itemCount,
        subtotal,
        estimatedTax,
        total,
        addItem,
        removeItem,
        setQuantity,
        openCart,
        closeCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
