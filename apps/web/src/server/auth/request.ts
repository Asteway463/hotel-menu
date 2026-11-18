import { cookies } from 'next/headers';
import { getAdminFromToken } from './session';

export interface AuthContext {
  adminId: string | null;
  adminEmail: string | null;
  restaurantId: string | null;
  restaurantSlug: string | null;
  role: string | null;
  token: string | null;
}

export async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value ?? null;
  const session = await getAdminFromToken(token);

  if (!session) {
    return {
      adminId: null,
      adminEmail: null,
      restaurantId: null,
      restaurantSlug: null,
      role: null,
      token,
    };
  }

  return {
    adminId: session.adminId,
    adminEmail: session.adminEmail,
    restaurantId: session.restaurantId,
    restaurantSlug: session.restaurantSlug,
    role: session.role,
    token,
  };
}

export function isAuthenticated(ctx: AuthContext): boolean {
  return Boolean(ctx.adminId && ctx.adminEmail && ctx.restaurantId && ctx.role);
}
