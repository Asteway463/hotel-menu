import { prisma } from '@/lib/db';
import { ProductInput } from '@burger/shared';

export async function listCategories(restaurantId: string) {
  return prisma.category.findMany({
    where: { restaurantId },
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
  });
}

export async function createCategory(
  restaurantId: string,
  input: {
    nameEn: string;
    nameAm: string;
    slug: string;
    descriptionEn?: string;
    descriptionAm?: string;
    sortOrder?: number;
    active?: boolean;
  }
) {
  const category = await prisma.category.create({
    data: {
      restaurantId,
      nameEn: input.nameEn,
      nameAm: input.nameAm,
      slug: input.slug,
      descriptionEn: input.descriptionEn ?? '',
      descriptionAm: input.descriptionAm ?? '',
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    },
  });
  return category;
}

export async function updateCategory(
  id: string,
  input: Partial<{
    nameEn: string;
    nameAm: string;
    slug: string;
    descriptionEn: string;
    descriptionAm: string;
    sortOrder: number;
    active: boolean;
  }>
) {
  return prisma.category.update({
    where: { id },
    data: input,
  });
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
}

export async function listProducts(
  restaurantId: string,
  categoryId?: string
) {
  return prisma.product.findMany({
    where: {
      restaurantId,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }, { nameEn: 'asc' }],
  });
}

export async function createProduct(restaurantId: string, input: ProductInput) {
  const product = await prisma.product.create({
    data: {
      restaurantId,
      categoryId: input.categoryId,
      nameEn: input.nameEn,
      nameAm: input.nameAm,
      descriptionEn: input.descriptionEn ?? '',
      descriptionAm: input.descriptionAm ?? '',
      image: input.image ?? null,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      ingredientsEn: input.ingredientsEn ?? null,
      ingredientsAm: input.ingredientsAm ?? null,
      allergens: input.allergens ? JSON.stringify(input.allergens) : null,
      featured: input.featured ?? false,
      available: input.available ?? true,
      prepTime: input.prepTime ?? null,
      sortOrder: input.sortOrder ?? 0,
      isCombo: input.isCombo ?? false,
      promoPrice: input.promoPrice ?? null,
      comboItems: input.comboItems ?? null,
    },
  });
  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<{
    categoryId: string;
    nameEn: string;
    nameAm: string;
    descriptionEn: string;
    descriptionAm: string;
    image: string | null;
    price: number;
    compareAtPrice: number | null;
    ingredientsEn: string | null;
    ingredientsAm: string | null;
    allergens: string | null;
    featured: boolean;
    available: boolean;
    prepTime: number | null;
    sortOrder: number;
    isCombo: boolean;
    promoPrice: number | null;
    comboItems: string | null;
  }>
) {
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
}

export async function getMenuForRestaurant(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) return null;

  const categories = await prisma.category.findMany({
    where: { restaurantId, active: true },
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    include: {
      products: {
        where: { available: true },
        orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      },
    },
  });

  return { restaurant, categories };
}
