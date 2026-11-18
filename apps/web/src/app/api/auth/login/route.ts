import { NextResponse } from 'next/server';
import { loginWithPassword } from '@/server/auth/auth.service';
import { destroySession } from '@/server/auth/session';
import { rateLimit } from '@/server/rate-limit';
import { AdminLoginInput } from '@burger/shared';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AdminLoginInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { allowed, retryAfterSeconds } = rateLimit(
    `login:${parsed.data.email.toLowerCase()}`,
    10,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts', retryAfterSeconds },
      { status: 429 }
    );
  }

  const result = await loginWithPassword(
    parsed.data.email,
    parsed.data.password
  );

  if (!result.ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const response = NextResponse.json({
    admin: {
      id: result.adminId,
      restaurantId: result.restaurantId,
      restaurantSlug: result.restaurantSlug,
      email: result.email,
      role: result.role,
    },
  });

  response.cookies.set('admin_session', result.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
