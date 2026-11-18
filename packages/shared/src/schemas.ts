/**
 * Zod validation schemas shared between the API layer and the admin/customer
 * clients. Server is the source of truth; clients mirror these contracts.
 */
import { z } from 'zod';

export const LocalizedTextSchema = z.object({
  en: z.string().min(1).max(200),
  am: z.string().min(1).max(200),
});

export const SocialLinksSchema = z.object({
  instagram: z.string().max(255).optional(),
  facebook: z.string().max(255).optional(),
  twitter: z.string().max(255).optional(),
  tiktok: z.string().max(255).optional(),
});

export const OpeningHoursSchema = z.object({
  mon: z.string().optional(),
  tue: z.string().optional(),
  wed: z.string().optional(),
  thu: z.string().optional(),
  fri: z.string().optional(),
  sat: z.string().optional(),
  sun: z.string().optional(),
});

export const restaurantProfileSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  nameEn: z.string().min(1).max(120),
  nameAm: z.string().min(1).max(120),
  taglineEn: z.string().max(200).default(''),
  taglineAm: z.string().max(200).default(''),
  storyEn: z.string().max(2000).default(''),
  storyAm: z.string().max(2000).default(''),
  logo: z.string().max(512).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  socials: SocialLinksSchema.optional(),
  openingHours: OpeningHoursSchema.optional(),
  currency: z.string().length(3).default('ETB'),
});

export const RestaurantProfileInput = restaurantProfileSchema;
export type RestaurantProfileInput = z.infer<typeof restaurantProfileSchema>;

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  nameEn: z.string().min(1).max(120),
  nameAm: z.string().min(1).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  descriptionEn: z.string().max(1000).default(''),
  descriptionAm: z.string().max(1000).default(''),
  sortOrder: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

export const CategoryInput = categorySchema;
export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  nameEn: z.string().min(1).max(160),
  nameAm: z.string().min(1).max(160),
  descriptionEn: z.string().max(2000).default(''),
  descriptionAm: z.string().max(2000).default(''),
  image: z.string().max(512).optional(),
  price: z.number().int().min(0).max(10_000_000),
  compareAtPrice: z.number().int().min(0).max(10_000_000).optional(),
  ingredientsEn: z.string().max(2000).optional(),
  ingredientsAm: z.string().max(2000).optional(),
  allergens: z.array(z.string()).max(20).optional(),
  featured: z.boolean().default(false),
  available: z.boolean().default(true),
  prepTime: z.number().int().min(0).max(600).optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isCombo: z.boolean().default(false),
  promoPrice: z.number().int().min(0).max(10_000_000).optional(),
  comboItems: z.string().optional(),
});

export const ProductInput = productSchema;
export type ProductInput = z.infer<typeof productSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const AdminLoginInput = adminLoginSchema;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(20),
  unitPrice: z.number().int().min(0),
  total: z.number().int().min(0),
  notes: z.string().max(500).optional(),
  addons: z.string().optional(),
});

export const orderCreateSchema = z.object({
  restaurantId: z.string().min(1),
  type: z.string().refine(
    (v) => ['DINING', 'TAKEAWAY', 'DELIVERY'].includes(v),
    { message: 'Invalid order type' }
  ),
  customerName: z.string().max(120).optional(),
  customerPhone: z.string().max(30).optional(),
  deliveryAddress: z.string().max(500).optional(),
  customerNotes: z.string().max(1000).optional(),
  paymentMethod: z
    .string()
    .refine(
      (v) => ['CASH', 'MANUAL_CARD'].includes(v),
      { message: 'Invalid payment method' }
    )
    .default('CASH'),
  paymentStatus: z
    .string()
    .refine(
      (v) => ['PENDING', 'PAID', 'CANCELLED'].includes(v),
      { message: 'Invalid payment status' }
    )
    .default('PENDING'),
  paid: z.boolean().default(false),
  subtotal: z.number().int().min(0).max(100_000_000),
  discount: z.number().int().min(0).max(10_000_000).default(0),
  total: z.number().int().min(0).max(100_000_000),
  tax: z.number().int().min(0).max(10_000_000).default(0),
  items: z.array(orderItemSchema).min(1).max(50),
  idempotencyKey: z.string().max(128).optional(),
});

export const OrderCreateInput = orderCreateSchema;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export const orderStatusUpdateSchema = z.object({
  status: z
    .string()
    .refine(
      (v) =>
        [
          'PENDING',
          'PAID',
          'PREPARING',
          'READY',
          'COMPLETED',
          'CANCELLED',
        ].includes(v),
      { message: 'Invalid order status' }
    ),
  paymentStatus: z
    .string()
    .refine(
      (v) => ['PENDING', 'PAID', 'CANCELLED'].includes(v),
      { message: 'Invalid payment status' }
    )
    .optional(),
});

export const OrderStatusUpdateInput = orderStatusUpdateSchema;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

export const menuQuerySchema = z.object({
  restaurantSlug: z.string().min(2).max(60),
});

export const MenuQueryInput = menuQuerySchema;
export type MenuQueryInput = z.infer<typeof menuQuerySchema>;
