import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { updateOrderStatus } from '@/server/services/orders.service';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  const order = await prisma.order.findFirst({
    where: { id, restaurantId: ctx.restaurantId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await request.json();

  const order = await updateOrderStatus(
    id,
    body.status,
    body.paymentStatus
  );

  return NextResponse.json({ order });
}
