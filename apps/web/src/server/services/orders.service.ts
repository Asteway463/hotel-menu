import { prisma } from '@/lib/db';
import { Order, OrderStatusValue, PaymentStatusValue } from '@burger/shared';
import { safeJsonParse } from '@burger/shared';

export interface CreateOrderInput {
  restaurantId: string;
  type: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  customerNotes?: string;
  paymentMethod: string;
  paymentStatus: string;
  paid: boolean;
  subtotal: number;
  discount: number;
  total: number;
  tax: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    notes?: string;
    addons?: string;
  }>;
  idempotencyKey?: string | null;
}

export interface CreateOrderResult {
  ok: boolean;
  order?: Order;
  error?: string;
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 46656)
    .toString(36)
    .toUpperCase()
    .padStart(3, '0');
  return `BH-${ts}${rand}`;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true },
    });
    if (existing) {
      return { ok: true, order: existing as unknown as Order };
    }
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: input.restaurantId },
  });
  if (!restaurant) return { ok: false, error: 'RESTAURANT_NOT_FOUND' };

  const validatedItems = [];
  for (const item of input.items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, restaurantId: restaurant.id },
    });
    if (!product) return { ok: false, error: 'PRODUCT_NOT_FOUND' };
    if (!product.available) return { ok: false, error: 'PRODUCT_UNAVAILABLE' };
    validatedItems.push({
      productId: product.id,
      productName: product.nameEn || product.nameAm,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
      notes: item.notes ?? null,
      addons: item.addons ?? null,
    });
  }

  const subtotal =
    validatedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) || 0;
  const discount = input.discount || 0;
  const tax = input.tax || 0;
  const total = Math.max(0, subtotal - discount + tax);

  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      orderNumber: generateOrderNumber(),
      type: input.type as Order['type'],
      status: 'PENDING' as const,
      subtotal,
      discount,
      total,
      tax,
      paymentStatus: (input.paymentStatus as PaymentStatusValue) || 'PENDING',
      paymentMethod: (input.paymentMethod as 'CASH' | 'MANUAL_CARD') || 'CASH',
      paidAt: input.paid ? new Date() : null,
      customerNotes: input.customerNotes || null,
      idempotencyKey: input.idempotencyKey || null,
      items: {
        create: validatedItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
          notes: i.notes,
          addons: i.addons,
        })),
      },
    },
    include: { items: true },
  });

  return { ok: true, order: order as unknown as Order };
}

export async function listOrders(params: {
  restaurantId: string;
  status?: string;
  paymentStatus?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = { restaurantId: params.restaurantId };
  if (params.status) where.status = params.status;
  if (params.paymentStatus) where.paymentStatus = params.paymentStatus;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
    take: params.limit ?? 100,
    skip: params.offset ?? 0,
  });

  return orders;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatusValue,
  paymentStatus?: PaymentStatusValue
) {
  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(paymentStatus === 'PAID' && status !== 'CANCELLED'
        ? { paidAt: new Date() }
        : {}),
    },
    include: { items: true },
  });
  return order;
}

export interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
  itemsSold: number;
  paidOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    type: string;
    createdAt: string;
  }>;
}

export async function getDailyStats(restaurantId: string, date?: Date): Promise<DailyStats> {
  const start = new Date(date ?? new Date());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: { gte: start, lt: end },
      status: { not: 'CANCELLED' },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      paymentStatus: true,
      type: true,
      createdAt: true,
    },
  });

  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const itemsSold = await prisma.orderItem.aggregate({
    where: {
      order: {
        restaurantId,
        createdAt: { gte: start, lt: end },
        status: { not: 'CANCELLED' },
      },
    },
    _sum: { quantity: true },
  });

  return {
    date: start.toISOString(),
    orders: orders.length,
    revenue,
    itemsSold: itemsSold._sum.quantity ?? 0,
    paidOrders: paidOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.total,
      paymentStatus: o.paymentStatus,
      type: o.type,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}
