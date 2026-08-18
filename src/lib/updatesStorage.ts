import type { UpdateEntry } from "@/lib/updates";

export const UPDATES_STORAGE_KEY = "dace_updates_v1";
export const UPDATES_CHANGED_EVENT = "dace:updates-changed";

export function loadUpdates(): UpdateEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(UPDATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as UpdateEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveUpdates(next: UpdateEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UPDATES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors (e.g., large images) instead of breaking the UI.
  }

  try {
    window.dispatchEvent(new CustomEvent(UPDATES_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

export function addUpdate(update: UpdateEntry): UpdateEntry[] {
  const prev = loadUpdates();
  const next = [update, ...prev];
  saveUpdates(next);
  return next;
}

export function removeUpdate(id: string): UpdateEntry[] {
  const prev = loadUpdates();
  const next = prev.filter((u) => u.id !== id);
  saveUpdates(next);
  return next;
}

