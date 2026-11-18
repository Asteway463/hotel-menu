import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { updateRestaurant } from '@/server/services/restaurant.service';
import { RestaurantProfileInput } from '@burger/shared';

export async function GET() {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: ctx.restaurantId },
  });

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  return NextResponse.json({ restaurant });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = RestaurantProfileInput.partial().safeParse({
    ...body,
    slug: body?.slug ?? 'burgerhouse',
    nameEn: body?.nameEn ?? 'Burger House',
    nameAm: body?.nameAm ?? 'ቡራጅለስ ሆውስ',
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const restaurant = await updateRestaurant(ctx.restaurantId, parsed.data);
  return NextResponse.json({ restaurant });
}
