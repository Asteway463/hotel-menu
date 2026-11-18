import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';

export async function GET() {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: ctx.adminId! },
    select: { id: true, email: true, role: true, restaurantId: true },
  });

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      restaurantId: admin.restaurantId,
    },
  });
}
