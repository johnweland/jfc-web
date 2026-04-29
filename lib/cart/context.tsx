"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  slug: string;
  name: string;
  sku: string;
  price: number;
  category: "firearm" | "part" | "apparel";
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
  | { type: "REMOVE"; slug: string }
  | { type: "SET_QTY"; slug: string; quantity: number }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "CLEAR" };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD": {
      const { quantity = 1, ...item } = action.payload;
      const existing = state.items.find((i) => i.slug === item.slug);
      if (existing) {
        return {
          ...state,
          isOpen: true,
          items: state.items.map((i) =>
            i.slug === item.slug
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      return {
        ...state,
        isOpen: true,
        items: [...state.items, { ...item, quantity }],
      };
    }
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((i) => i.slug !== action.slug),
      };
    case "SET_QTY": {
      if (action.quantity < 1) {
        return {
          ...state,
          items: state.items.filter((i) => i.slug !== action.slug),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.slug === action.slug ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
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

// ─── Context ─────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) =>
      dispatch({ type: "ADD", payload: item }),
    []
  );
  const removeItem = useCallback(
    (slug: string) => dispatch({ type: "REMOVE", slug }),
    []
  );
  const setQuantity = useCallback(
    (slug: string, quantity: number) =>
      dispatch({ type: "SET_QTY", slug, quantity }),
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

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        itemCount,
        subtotal,
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
