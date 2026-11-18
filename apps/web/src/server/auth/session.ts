import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';

export const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

export interface AuthResult {
  adminId: string;
  token: string;
}

export async function createSession(adminUserId: string): Promise<AuthResult> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.session.create({
    data: { adminUserId, tokenHash, expiresAt },
  });

  return { adminId: session.adminUserId, token };
}

export async function getAdminFromToken(
  token: string | undefined | null
): Promise<{
  adminId: string;
  adminEmail: string;
  restaurantId: string;
  restaurantSlug: string;
  role: string;
} | null> {
  if (!token) return null;

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const session = await prisma.session.findUnique({
    where: { tokenHash },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: session.adminUserId },
  });
  if (!adminUser) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: adminUser.restaurantId },
  });

  if (!restaurant) return null;

  // Sliding expiration
  if (session.expiresAt < new Date(Date.now() + 1000 * 60 * 60)) {
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
  }

  return {
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    role: adminUser.role,
  };
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.session.delete({ where: { tokenHash } }).catch(() => null);
}
