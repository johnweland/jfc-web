"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { AvailabilityStatus } from "@/lib/data/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FavoriteItem {
  slug: string;
  name: string;
  sku: string;
  price: number;
  category: "firearm" | "part" | "apparel";
  status: AvailabilityStatus;
}

type Action =
  | { type: "TOGGLE"; item: FavoriteItem }
  | { type: "REMOVE"; slug: string };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function favoritesReducer(
  state: FavoriteItem[],
  action: Action
): FavoriteItem[] {
  switch (action.type) {
    case "TOGGLE": {
      const exists = state.some((i) => i.slug === action.item.slug);
      return exists
        ? state.filter((i) => i.slug !== action.item.slug)
        : [...state, action.item];
    }
    case "REMOVE":
      return state.filter((i) => i.slug !== action.slug);
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  isFavorited: (slug: string) => boolean;
  toggle: (item: FavoriteItem) => void;
  remove: (slug: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, dispatch] = useReducer(favoritesReducer, []);

  const toggle = useCallback(
    (item: FavoriteItem) => dispatch({ type: "TOGGLE", item }),
    []
  );
  const remove = useCallback(
    (slug: string) => dispatch({ type: "REMOVE", slug }),
    []
  );
  const isFavorited = useCallback(
    (slug: string) => favorites.some((i) => i.slug === slug),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorited, toggle, remove }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
