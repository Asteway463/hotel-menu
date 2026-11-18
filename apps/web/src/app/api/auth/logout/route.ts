import { NextResponse } from 'next/server';
import { destroySession } from '@/server/auth/session';
import { getAuthContext } from '@/server/auth/request';

export async function POST() {
  const ctx = await getAuthContext();
  if (ctx.token) {
    await destroySession(ctx.token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
