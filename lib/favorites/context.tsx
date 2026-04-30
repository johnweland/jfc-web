"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";
import type { AvailabilityStatus } from "@/lib/data/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FavoriteItem {
  slug: string;
  name: string;
  sku: string;
  price: number;
  category: "firearm" | "part" | "apparel";
  status: AvailabilityStatus;
  imageUrl?: string;
}

// Internal record adds the Amplify row ID so we can delete it later
type StoredFavorite = FavoriteItem & { amplifyId?: string };

type Action =
  | { type: "SET_ALL"; items: StoredFavorite[] }
  | { type: "ADD"; item: StoredFavorite }
  | { type: "REMOVE"; slug: string }
  | { type: "SET_AMPLIFY_ID"; slug: string; amplifyId: string }
  | { type: "SET_IMAGE_URLS"; imageUrls: Record<string, string | null> };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: StoredFavorite[], action: Action): StoredFavorite[] {
  switch (action.type) {
    case "SET_ALL":
      return action.items;
    case "ADD":
      return state.some((i) => i.slug === action.item.slug)
        ? state
        : [...state, action.item];
    case "REMOVE":
      return state.filter((i) => i.slug !== action.slug);
    case "SET_AMPLIFY_ID":
      return state.map((i) =>
        i.slug === action.slug ? { ...i, amplifyId: action.amplifyId } : i,
      );
    case "SET_IMAGE_URLS":
      return state.map((item) => {
        if (!(item.slug in action.imageUrls)) {
          return item;
        }

        return {
          ...item,
          imageUrl: action.imageUrls[item.slug] ?? undefined,
        };
      });
    default:
      return state;
  }
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = "jfc-favorites";

function loadFromStorage(): StoredFavorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredFavorite[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: StoredFavorite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* storage unavailable */ }
}

// ─── Amplify client ───────────────────────────────────────────────────────────

const client = generateClient<Schema>();

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
  // userId is the Cognito sub — null means not authenticated
  const [userId, setUserId] = useReducer(
    (_: string | null, next: string | null) => next,
    null,
  );

  // Always start empty so server and client render the same initial HTML.
  // localStorage is loaded in the effect below after hydration completes.
  const [items, dispatch] = useReducer(reducer, []);

  // Persist to localStorage on every change (works for both auth states)
  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  // On mount: load localStorage, then check auth and sync with Amplify if logged in.
  // The `cancelled` flag prevents React Strict Mode's double-invoke from creating
  // duplicate Amplify records (second invocation's cleanup sets cancelled = true).
  useEffect(() => {
    let cancelled = false;

    // Load localStorage first — client-only, runs after hydration
    const stored = loadFromStorage();
    if (stored.length > 0) {
      dispatch({ type: "SET_ALL", items: stored });
    }

    getCurrentUser()
      .then(async ({ userId: sub }) => {
        if (cancelled) return;
        setUserId(sub);

        const { data: rows } = await client.models.CustomerFavorite.list({
          filter: { customerId: { eq: sub } },
        });

        if (cancelled) return;

        // Deduplicate Amplify rows by slug (self-heals any prior double-creates).
        // Extra rows are deleted in the background.
        const seenSlugs = new Set<string>();
        const amplifyFavs: StoredFavorite[] = [];
        for (const r of rows ?? []) {
          if (!seenSlugs.has(r.slug)) {
            seenSlugs.add(r.slug);
            amplifyFavs.push({
              slug: r.slug,
              name: r.name,
              sku: r.sku ?? "",
              price: r.price,
              category: r.category as FavoriteItem["category"],
              status: r.status as AvailabilityStatus,
              imageUrl: r.imageUrl ?? undefined,
              amplifyId: r.id,
            });
          } else {
            client.models.CustomerFavorite.delete({ id: r.id }).catch(() => {});
          }
        }

        // Push any localStorage-only items up to Amplify (login merge)
        const unsynced = stored.filter(
          (l) => !amplifyFavs.some((a) => a.slug === l.slug),
        );

        const merged: StoredFavorite[] = [...amplifyFavs];

        for (const item of unsynced) {
          if (cancelled) break;
          const { data: created } = await client.models.CustomerFavorite.create({
            customerId: sub,
            slug: item.slug,
            name: item.name,
            sku: item.sku,
            price: item.price,
            category: item.category,
            status: item.status,
            imageUrl: item.imageUrl,
          }).catch(() => ({ data: null }));

          merged.push({ ...item, amplifyId: created?.id ?? undefined });
        }

        if (!cancelled) {
          dispatch({ type: "SET_ALL", items: merged });
        }
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const controller = new AbortController();
    const slugs = Array.from(new Set(items.map((item) => item.slug)));

    void fetch(`/api/favorites-images?${new URLSearchParams({ slug: slugs.join(",") }).toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as {
          imageUrls?: Record<string, string | null>;
        };
        return payload.imageUrls ?? null;
      })
      .then((imageUrls) => {
        if (!imageUrls) {
          return;
        }

        const hasChanges = items.some((item) => {
          if (!(item.slug in imageUrls)) {
            return false;
          }

          const nextImageUrl = imageUrls[item.slug] ?? undefined;
          return item.imageUrl !== nextImageUrl;
        });

        if (hasChanges) {
          dispatch({ type: "SET_IMAGE_URLS", imageUrls });
        }
      })
      .catch((error) => {
        const err = error as Error;
        const isTransientFetchFailure =
          err.name === "AbortError" ||
          (err.name === "TypeError" && err.message === "Failed to fetch");

        if (!isTransientFetchFailure) {
          console.error("[favorites] image refresh failed", error);
        }
      });

    return () => {
      controller.abort();
    };
  }, [items]);

  const toggle = useCallback(
    async (item: FavoriteItem) => {
      const existing = items.find((i) => i.slug === item.slug);

      if (existing) {
        // Optimistic remove
        dispatch({ type: "REMOVE", slug: item.slug });
        if (userId && existing.amplifyId) {
          await client.models.CustomerFavorite.delete({
            id: existing.amplifyId,
          }).catch(() => {});
        }
      } else {
        // Optimistic add
        dispatch({ type: "ADD", item });
        if (userId) {
          const { data: created } = await client.models.CustomerFavorite.create({
            customerId: userId,
            slug: item.slug,
            name: item.name,
            sku: item.sku,
            price: item.price,
            category: item.category,
            status: item.status,
            imageUrl: item.imageUrl,
          }).catch(() => ({ data: null }));

          if (created) {
            dispatch({ type: "SET_AMPLIFY_ID", slug: item.slug, amplifyId: created.id });
          }
        }
      }
    },
    [items, userId],
  );

  const remove = useCallback(
    async (slug: string) => {
      const existing = items.find((i) => i.slug === slug);
      dispatch({ type: "REMOVE", slug });
      if (userId && existing?.amplifyId) {
        await client.models.CustomerFavorite.delete({
          id: existing.amplifyId,
        }).catch(() => {});
      }
    },
    [items, userId],
  );

  const isFavorited = useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items],
  );

  // Strip internal amplifyId before exposing through context
  const favorites: FavoriteItem[] = items.map((item) => ({
    slug: item.slug,
    name: item.name,
    sku: item.sku,
    price: item.price,
    category: item.category,
    status: item.status,
    imageUrl: item.imageUrl,
  }));

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
