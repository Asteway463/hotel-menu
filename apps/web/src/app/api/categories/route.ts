import { NextResponse } from 'next/server';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { listCategories, createCategory, updateCategory, deleteCategory } from '@/server/services/menu.service';
import { CategoryInput } from '@burger/shared';

export async function GET() {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const categories = await listCategories(ctx.restaurantId);
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = CategoryInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const category = await createCategory(ctx.restaurantId, parsed.data);
  return NextResponse.json({ category }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const parsed = CategoryInput.partial().safeParse({ id, ...rest });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const category = await updateCategory(id, rest);
  return NextResponse.json({ category });
}

export async function DELETE(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteCategory(body.id);
  return NextResponse.json({ ok: true });
}
