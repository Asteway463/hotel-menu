import { prisma } from '@/lib/db';
import { RestaurantProfileInput } from '@burger/shared';

export async function getRestaurantBySlug(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { categories: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!restaurant || !restaurant.active) return null;
  return restaurant;
}

export async function listRestaurants() {
  return prisma.restaurant.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createRestaurant(input: RestaurantProfileInput) {
  const slug = input.slug;
  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (existing) {
    return { ok: false as const, error: 'SLUG_TAKEN' as const };
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      slug,
      nameEn: input.nameEn,
      nameAm: input.nameAm,
      taglineEn: input.taglineEn ?? '',
      taglineAm: input.taglineAm ?? '',
      storyEn: input.storyEn ?? '',
      storyAm: input.storyAm ?? '',
      logo: input.logo ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      instagram: input.socials?.instagram ?? null,
      facebook: input.socials?.facebook ?? null,
      twitter: input.socials?.twitter ?? null,
      tiktok: input.socials?.tiktok ?? null,
      openingHours: input.openingHours ? JSON.stringify(input.openingHours) : null,
      currency: input.currency ?? 'ETB',
      wifiSsid: null,
      wifiPassword: null,
      active: true,
    },
  });

  return { ok: true as const, restaurant };
}

export async function updateRestaurant(
  restaurantId: string,
  input: Partial<RestaurantProfileInput>
) {
  const restaurant = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      slug: input.slug,
      nameEn: input.nameEn,
      nameAm: input.nameAm,
      taglineEn: input.taglineEn ?? undefined,
      taglineAm: input.taglineAm ?? undefined,
      storyEn: input.storyEn ?? undefined,
      storyAm: input.storyAm ?? undefined,
      logo: input.logo ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      instagram: input.socials?.instagram ?? null,
      facebook: input.socials?.facebook ?? null,
      twitter: input.socials?.twitter ?? null,
      tiktok: input.socials?.tiktok ?? null,
      openingHours: input.openingHours ? JSON.stringify(input.openingHours) : null,
      currency: input.currency ?? 'ETB',
    },
  });
  return restaurant;
}
