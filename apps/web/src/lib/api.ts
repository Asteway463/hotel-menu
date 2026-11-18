import type { Category, Product, Restaurant } from '@burger/shared';

export interface MenuData {
  restaurant: Restaurant;
  categories: Category[];
}

export const DEFAULT_RESTAURANT_SLUG =
  process.env.NEXT_PUBLIC_RESTAURANT_SLUG || 'burgerhouse';

export async function getMenu(slug: string = DEFAULT_RESTAURANT_SLUG): Promise<MenuData | null> {
  const res = await fetch(`/api/restaurants/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { restaurant: Restaurant; categories: Category[] };
  return { restaurant: data.restaurant, categories: data.categories };
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { product: Product };
  return data.product ?? null;
}

export function formatPrice(amount: number, currency: string = 'ETB'): string {
  return `${amount.toLocaleString('en-US')} ${currency}`;
}
