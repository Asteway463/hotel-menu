import { NextResponse } from 'next/server';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { createOrder, listOrders } from '@/server/services/orders.service';
import { OrderCreateInput } from '@burger/shared';

export async function GET() {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await listOrders({ restaurantId: ctx.restaurantId });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = OrderCreateInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createOrder(parsed.data);

  if (!result.ok || !result.order) {
    const status =
      result.error === 'RESTAURANT_NOT_FOUND'
        ? 404
        : result.error === 'PRODUCT_NOT_FOUND'
          ? 400
          : result.error === 'PRODUCT_UNAVAILABLE'
            ? 409
            : 400;
    return NextResponse.json({ error: result.error ?? 'Order failed' }, { status });
  }

  return NextResponse.json({ order: result.order }, { status: 201 });
}
