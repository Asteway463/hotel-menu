import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRestaurantBySlug } from '@/server/services/restaurant.service';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json(
      { error: 'Restaurant not found' },
      { status: 404 }
    );
  }

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id, active: true },
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    include: {
      products: {
        where: { available: true },
        orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      },
    },
  });

  return NextResponse.json({ restaurant, categories });
}
