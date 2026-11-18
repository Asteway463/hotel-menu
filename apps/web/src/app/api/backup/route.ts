import { NextResponse } from 'next/server';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
  const dbPath = dbUrl.replace(/^file:/, '');
  const absolute = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(process.cwd(), 'packages/database/prisma', dbPath);

  const data = await readFile(absolute).catch(() => null);
  if (!data) {
    return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
  }

  return new NextResponse(data, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': `attachment; filename="burger-house-backup-${new Date().toISOString().slice(0, 10)}.db"`,
    },
  });
}
