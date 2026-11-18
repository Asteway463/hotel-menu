import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { listProducts, createProduct, updateProduct, deleteProduct } from '@/server/services/menu.service';
import { ProductInput } from '@burger/shared';
export async function GET(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const id = searchParams.get('id') ?? undefined;

  if (id) {
    const product = await prisma.product.findFirst({
      where: { id, restaurantId: ctx.restaurantId },
    });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product });
  }

  const products = await listProducts(ctx.restaurantId, categoryId ?? undefined);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = ProductInput.safeParse({ ...body, restaurantId: ctx.restaurantId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const product = await createProduct(ctx.restaurantId, parsed.data);
  return NextResponse.json({ product }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const data: Record<string, unknown> = { ...rest };
  if (data.allergens !== undefined) data.allergens = JSON.stringify(data.allergens);
  if (data.comboItems !== undefined) data.comboItems = data.comboItems ? JSON.stringify(data.comboItems) : null;
  const product = await updateProduct(id, data as never);
  return NextResponse.json({ product });
}

export async function DELETE(request: Request) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteProduct(body.id);
  return NextResponse.json({ ok: true });
}
