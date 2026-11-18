import { NextResponse } from 'next/server';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { getDailyStats } from '@/server/services/orders.service';

export async function GET() {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await getDailyStats(ctx.restaurantId);
  return NextResponse.json({ stats });
}
