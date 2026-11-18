import { get, set } from 'idb-keyval';

const MENU_CACHE_KEY = 'burger-house:menu';

export async function cacheMenu(data: unknown): Promise<void> {
  try {
    await set(MENU_CACHE_KEY, data);
  } catch {
    // IndexedDB unavailable (private mode etc.) — fail silently.
  }
}

export async function getCachedMenu<T>(): Promise<T | null> {
  try {
    const value = await get<T | null>(MENU_CACHE_KEY);
    return value ?? null;
  } catch {
    return null;
  }
}
