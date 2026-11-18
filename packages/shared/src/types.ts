import type {
  OrderStatusValue,
  OrderTypeValue,
  PaymentMethodValue,
  PaymentStatusValue,
} from './constants';

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
}

export interface OpeningHours {
  [day: string]: { open: string; close: string } | null;
}

export interface Restaurant {
  id: string;
  slug: string;
  nameEn: string;
  nameAm: string;
  taglineEn: string;
  taglineAm: string;
  storyEn: string;
  storyAm: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  socials: SocialLinks;
  openingHours: OpeningHours | null;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  restaurantId: string;
  nameEn: string;
  nameAm: string;
  slug: string;
  descriptionEn: string;
  descriptionAm: string;
  sortOrder: number;
  active: boolean;
  products: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  nameEn: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAm: string;
  image: string | null;
  /** Price in smallest currency unit (integer ETB). */
  price: number;
  /** Optional superseded price (used for promotions). */
  compareAtPrice: number | null;
  /** Optional promotional price. */
  promoPrice: number | null;
  ingredientsEn: string | null;
  ingredientsAm: string | null;
  allergens: string[];
  featured: boolean;
  available: boolean;
  prepTime: number | null;
  sortOrder: number;
  isCombo: boolean;
  /** JSON-encoded combo composition. */
  comboItems: string | null;
  /** JSON-encoded customization options. */
  customizations: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  categories: Category[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes: string | null;
  addons: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  type: OrderTypeValue;
  status: OrderStatusValue;
  subtotal: number;
  discount: number;
  total: number;
  tax: number;
  paymentStatus: PaymentStatusValue;
  paymentMethod: PaymentMethodValue | null;
  paidAt: Date | string | null;
  customerNotes: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  restaurantId: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAdminUser {
  id: string;
  restaurantId: string;
  email: string;
  role: string;
}

/** A single line in the customer cart (prices snapshot at add time). */
export interface CartLine {
  lineId: string;
  productId: string;
  nameEn: string;
  nameAm: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  addons: string | null;
  notes: string | null;
  isCombo: boolean;
}
