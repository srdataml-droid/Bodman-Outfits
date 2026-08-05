"use client";

import { useSyncExternalStore } from "react";

/**
 * Device-local favorites.
 *
 * THE LIMITATION IS THE DESIGN, not an oversight: there is no customer
 * account system, so there is nobody to attach a favorite to. These live in
 * this browser's localStorage and nowhere else. They do not follow a customer
 * to their phone, they do not survive clearing site data, and the atelier
 * cannot see them. Every surface that shows favorites says so in plain words
 * (see FAVORITES_SCOPE_NOTE) rather than letting someone assume otherwise and
 * lose a list they thought was saved.
 *
 * Keyed by "category/slug" rather than by any generated id. When garments
 * move into the database, `category` and `slug` are columns on that table, so
 * a favorite saved today still resolves afterwards. A cuid would not have
 * survived the move.
 */

const STORAGE_KEY = "bodman.favorites.v1";

export const FAVORITES_SCOPE_NOTE =
  "Saved on this device only. Your list stays in this browser, so it will not follow you to another phone or computer, and clearing your browsing data clears it.";

export type FavoriteId = string;

export function favoriteId(category: string, slug: string): FavoriteId {
  return `${category}/${slug}`;
}

export function parseFavoriteId(id: FavoriteId): { category: string; slug: string } | null {
  const parts = id.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { category: parts[0], slug: parts[1] };
}

/*
 * A module-level store rather than per-component state, so a heart on a
 * catalogue card and the same garment's heart on the saved page never
 * disagree. `useSyncExternalStore` is the supported way to read it: the
 * server snapshot is deliberately empty (the server cannot know what is in
 * someone's browser), and React re-renders after hydration without treating
 * the difference as a mismatch.
 */
const EMPTY: readonly FavoriteId[] = Object.freeze([]);

let snapshot: readonly FavoriteId[] = EMPTY;
let loaded = false;
let listening = false;
const listeners = new Set<() => void>();

function readStorage(): readonly FavoriteId[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed.filter((value): value is string => typeof value === "string");
    return ids.length > 0 ? Object.freeze(ids) : EMPTY;
  } catch {
    // Corrupt or unreadable storage (private mode, quota, hand-edited JSON)
    // degrades to "no favorites", never to a crash on a catalogue page.
    return EMPTY;
  }
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  snapshot = readStorage();
  loaded = true;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function commit(next: readonly FavoriteId[]): void {
  snapshot = next.length > 0 ? Object.freeze([...next]) : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage can be full or blocked. The in-memory list still updates so the
    // UI stays responsive for this page view; it simply will not persist.
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  ensureLoaded();
  listeners.add(listener);

  // Attached once, not per subscriber, so a page with twelve cards does not
  // register twelve identical window listeners. Keeps other tabs in sync.
  if (!listening && typeof window !== "undefined") {
    listening = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY) return;
      snapshot = readStorage();
      emit();
    });
  }

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): readonly FavoriteId[] {
  ensureLoaded();
  return snapshot;
}

function getServerSnapshot(): readonly FavoriteId[] {
  return EMPTY;
}

/** All favorited ids, newest last. Empty during server render and first paint. */
export function useFavorites(): readonly FavoriteId[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsFavorite(id: FavoriteId): boolean {
  return useFavorites().includes(id);
}

export function toggleFavorite(id: FavoriteId): void {
  ensureLoaded();
  const next = snapshot.includes(id) ? snapshot.filter((value) => value !== id) : [...snapshot, id];
  commit(next);
}
