import { prisma } from '@/lib/db';
import { verifyPassword } from './password';
import { createSession } from './session';
import { AdminLoginInput } from '@burger/shared';

export interface LoginSuccess {
  ok: true;
  token: string;
  adminId: string;
  restaurantId: string;
  restaurantSlug: string;
  email: string;
  role: string;
}

export interface LoginFailure {
  ok: false;
  error: 'INVALID_CREDENTIALS';
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<LoginSuccess | LoginFailure> {
  const adminUser = await prisma.adminUser.findFirst({
    where: { email: { equals: email } },
  });

  if (!adminUser) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  const passwordOk = await verifyPassword(password, adminUser.passwordHash);
  if (!passwordOk) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  const session = await createSession(adminUser.id);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: adminUser.restaurantId },
  });

  if (!restaurant) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  return {
    ok: true,
    token: session.token,
    adminId: adminUser.id,
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    email: adminUser.email,
    role: adminUser.role,
  };
}

export function assertValidLoginInput(input: AdminLoginInput) {
  return AdminLoginInput.safeParse(input);
}
