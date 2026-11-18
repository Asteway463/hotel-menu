/**
 * Application-wide constants and domain enums.
 * Keep in sync with the Prisma schema in `@burger/database`.
 */

export const ORDER_TYPES = ['DINING', 'TAKEAWAY', 'DELIVERY'] as const;
export type OrderTypeValue = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ['CASH', 'MANUAL_CARD'] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

export const ADMIN_ROLES = ['OWNER', 'MANAGER', 'STAFF'] as const;
export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

export const CURRENCIES = ['ETB'] as const;

export const APP_NAME = 'Burger House';

export const DEFAULT_TAX_RATE = 0; // local orders: tax handled at counter

export function isOrderType(v: unknown): v is OrderTypeValue {
  return typeof v === 'string' && (ORDER_TYPES as readonly string[]).includes(v);
}

export function isOrderStatus(v: unknown): v is OrderStatusValue {
  return typeof v === 'string' && (ORDER_STATUSES as readonly string[]).includes(v);
}

export function isPaymentStatus(v: unknown): v is PaymentStatusValue {
  return (
    typeof v === 'string' &&
    (PAYMENT_STATUSES as readonly string[]).includes(v)
  );
}

export function isPaymentMethod(
  v: unknown
): v is PaymentMethodValue {
  return typeof v === 'string' && (PAYMENT_METHODS as readonly string[]).includes(v);
}

export function isAdminRole(v: unknown): v is AdminRoleValue {
  return typeof v === 'string' && (ADMIN_ROLES as readonly string[]).includes(v);
}

/** Safe JSON-array parse for free-text columns (allergens, combo items). */
export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
