import { NextResponse } from 'next/server';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
const MAX_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || '5');

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const safe = cleaned.replace(/^[.]+/, '') || 'upload';
  return safe.slice(-80);
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const filename = `${Date.now()}-${sanitizeFilename(file.name.replace(/\.[a-zA-Z0-9]+$/, ''))}${ext}`;
  const targetDir = path.join(process.cwd(), UPLOAD_DIR);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${filename}`, filename });
}
