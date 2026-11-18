'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Category, Product } from '@burger/shared';

interface CategoryFormState {
  id?: string;
  nameEn: string;
  nameAm: string;
  slug: string;
  descriptionEn: string;
  descriptionAm: string;
  sortOrder: number;
  active: boolean;
}

interface ProductFormState {
  id?: string;
  categoryId: string;
  nameEn: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAm: string;
  image: string;
  price: string;
  compareAtPrice: string;
  promoPrice: string;
  ingredientsEn: string;
  ingredientsAm: string;
  allergens: string;
  featured: boolean;
  available: boolean;
  prepTime: string;
  sortOrder: string;
  isCombo: boolean;
}

const emptyCategoryForm: CategoryFormState = {
  nameEn: '',
  nameAm: '',
  slug: '',
  descriptionEn: '',
  descriptionAm: '',
  sortOrder: 0,
  active: true,
};

const emptyProductForm: ProductFormState = {
  categoryId: '',
  nameEn: '',
  nameAm: '',
  descriptionEn: '',
  descriptionAm: '',
  image: '',
  price: '',
  compareAtPrice: '',
  promoPrice: '',
  ingredientsEn: '',
  ingredientsAm: '',
  allergens: '',
  featured: false,
  available: true,
  prepTime: '',
  sortOrder: '0',
  isCombo: false,
};

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryFormState | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductFormState | null>(null);

  const [productError, setProductError] = useState<string | null>(null);

  async function load() {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
      ]);
      const catData = await catRes.json();
      const prodData = await prodRes.json();
      if (!catRes.ok) throw new Error(catData.error ?? 'Failed to load categories');
      if (!prodRes.ok) throw new Error(prodData.error ?? 'Failed to load products');
      setCategories(catData.categories ?? []);
      setProducts(prodData.products ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      nameEn: String(form.get('nameEn')),
      nameAm: String(form.get('nameAm')),
      slug: String(form.get('slug')),
      descriptionEn: String(form.get('descriptionEn') ?? ''),
      descriptionAm: String(form.get('descriptionAm') ?? ''),
      sortOrder: Number(form.get('sortOrder') ?? 0),
      active: Boolean(form.get('active') ?? true),
    };
    const res = await fetch('/api/categories', {
      method: categoryForm?.id ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(categoryForm?.id ? { ...payload, id: categoryForm.id } : payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'Failed to save category');
    setCategoryForm(null);
    await load();
  }

  async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingProduct) return;
    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      categoryId: String(form.get('categoryId')),
      nameEn: String(form.get('nameEn')),
      nameAm: String(form.get('nameAm')),
      descriptionEn: String(form.get('descriptionEn') ?? ''),
      descriptionAm: String(form.get('descriptionAm') ?? ''),
      image: String(form.get('image') ?? '') || null,
      price: Number(form.get('price')),
      compareAtPrice: form.get('compareAtPrice') ? Number(form.get('compareAtPrice')) : null,
      promoPrice: form.get('promoPrice') ? Number(form.get('promoPrice')) : null,
      ingredientsEn: String(form.get('ingredientsEn') ?? '') || null,
      ingredientsAm: String(form.get('ingredientsAm') ?? '') || null,
      allergens: String(form.get('allergens') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      featured: Boolean(form.get('featured')),
      available: Boolean(form.get('available')),
      prepTime: form.get('prepTime') ? Number(form.get('prepTime')) : null,
      sortOrder: Number(form.get('sortOrder') ?? 0),
      isCombo: Boolean(form.get('isCombo')),
    };
    const res = await fetch('/api/products', {
      method: editingProduct.id ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, id: editingProduct.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'Failed to save product');
    setEditingProduct(null);
    await load();
  }

  async function toggleProductAvailability(productId: string, available: boolean) {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: productId, available }),
    });
    if (!res.ok) throw new Error('Failed to update product');
    await load();
  }

  async function toggleFeatured(productId: string, featured: boolean) {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: productId, featured }),
    });
    if (!res.ok) throw new Error('Failed to update product');
    await load();
  }

  async function removeProduct(productId: string) {
    const res = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: productId }),
    });
    if (!res.ok) throw new Error('Failed to delete product');
    await load();
  }

  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const list = map.get(product.categoryId) ?? [];
      list.push(product);
      map.set(product.categoryId, list);
    }
    return map;
  }, [products]);

  if (loading) return <p className="text-white/70">Loading menu…</p>;
  if (error) return <p className="text-red-300">{error}</p>;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Menu Management</h1>
          <p className="mt-1 text-white/60">Categories, products, pricing and availability.</p>
        </div>
      </div>

      {/* Categories */}
      <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">Categories</h2>
          <button
            onClick={() => setCategoryForm({ ...emptyCategoryForm })}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Add category
          </button>
        </div>

        {categoryForm ? (
          <form onSubmit={saveCategory} className="mb-6 grid gap-4 rounded-xl bg-white/5 p-4 sm:grid-cols-2">
            <input name="nameEn" required placeholder="Name (EN)" defaultValue={categoryForm.nameEn} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="nameAm" required placeholder="Name (Am)" defaultValue={categoryForm.nameAm} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="slug" required placeholder="slug" defaultValue={categoryForm.slug} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="descriptionEn" placeholder="Description (EN)" defaultValue={categoryForm.descriptionEn} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="descriptionAm" placeholder="Description (Am)" defaultValue={categoryForm.descriptionAm} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="sortOrder" type="number" defaultValue={categoryForm.sortOrder} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" name="active" defaultChecked={categoryForm.active} className="accent-primary" /> Active
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Save</button>
              <button type="button" onClick={() => setCategoryForm(null)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">Cancel</button>
            </div>
          </form>
        ) : null}

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <div>
                <p className="font-semibold text-white">{category.nameEn}</p>
                <p className="text-sm text-white/60">{category.nameAm}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCategoryForm({ id: category.id, nameEn: category.nameEn, nameAm: category.nameAm, slug: category.slug, descriptionEn: category.descriptionEn, descriptionAm: category.descriptionAm, sortOrder: category.sortOrder, active: category.active })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Edit</button>
                <button onClick={async () => { await fetch('/api/categories', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: category.id }) }); await load(); }} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300">Delete</button>
              </div>
            </div>
          ))}
          {categories.length === 0 ? <p className="text-sm text-white/60">No categories yet.</p> : null}
        </div>
      </section>

      {/* Products */}
      <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">Products</h2>
          <button
            onClick={() => setEditingProduct({ ...emptyProductForm, categoryId: categories[0]?.id ?? '' })}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Add product
          </button>
        </div>

        {editingProduct ? (
          <form onSubmit={saveProduct} className="mb-6 grid gap-4 rounded-xl bg-white/5 p-4 sm:grid-cols-2">
            <select name="categoryId" required defaultValue={editingProduct.categoryId} className="rounded-xl bg-white/5 px-4 py-2 text-white">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </select>
            <input name="nameEn" required placeholder="Name (EN)" defaultValue={editingProduct.nameEn} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="nameAm" required placeholder="Name (Am)" defaultValue={editingProduct.nameAm} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <textarea name="descriptionEn" placeholder="Description (EN)" defaultValue={editingProduct.descriptionEn} rows={2} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <textarea name="descriptionAm" placeholder="Description (Am)" defaultValue={editingProduct.descriptionAm} rows={2} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="image" placeholder="Image path" defaultValue={editingProduct.image} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="price" type="number" required min="0" step="1" placeholder="Price (ETB)" defaultValue={editingProduct.price} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="compareAtPrice" type="number" min="0" step="1" placeholder="Compare-at price (ETB, optional)" defaultValue={editingProduct.compareAtPrice ?? ''} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="promoPrice" type="number" min="0" step="1" placeholder="Promo price (ETB, optional)" defaultValue={editingProduct.promoPrice ?? ''} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <textarea name="ingredientsEn" placeholder="Ingredients (EN)" defaultValue={editingProduct.ingredientsEn} rows={2} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <textarea name="ingredientsAm" placeholder="Ingredients (Am)" defaultValue={editingProduct.ingredientsAm} rows={2} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="allergens" placeholder="Allergens (comma separated)" defaultValue={editingProduct.allergens} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="prepTime" type="number" min="0" placeholder="Prep time (min)" defaultValue={editingProduct.prepTime ?? ''} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <input name="sortOrder" type="number" defaultValue={editingProduct.sortOrder} className="rounded-xl bg-white/5 px-4 py-2 text-white" />
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" name="featured" defaultChecked={editingProduct.featured} className="accent-primary" /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" name="available" defaultChecked={editingProduct.available} className="accent-primary" /> Available
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" name="isCombo" defaultChecked={editingProduct.isCombo} className="accent-primary" /> Combo
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Save</button>
              <button type="button" onClick={() => setEditingProduct(null)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">Cancel</button>
            </div>
          </form>
        ) : null}

        {productError ? <p className="mb-4 text-sm text-red-300">{productError}</p> : null}

        <div className="space-y-6">
          {[...productsByCategory.entries()].map(([categoryId, list]) => {
            const category = categories.find((c) => c.id === categoryId);
            return (
              <div key={categoryId}>
                <h3 className="font-display text-lg font-semibold text-white">{category?.nameEn ?? 'Uncategorized'}</h3>
                <div className="mt-2 space-y-2">
                  {list.map((product) => (
                    <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">{product.nameEn}</p>
                        <p className="text-sm text-white/60">{product.nameAm}</p>
                        <p className="text-sm text-white/60">{product.price} ETB{product.promoPrice ? ` · promo ${product.promoPrice} ETB` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => void toggleProductAvailability(product.id, !product.available)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                          {product.available ? 'Set unavailable' : 'Set available'}
                        </button>
                        <button onClick={() => void toggleFeatured(product.id, !product.featured)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                          {product.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button onClick={() => setEditingProduct({ ...emptyProductForm, id: product.id, categoryId: product.categoryId, nameEn: product.nameEn, nameAm: product.nameAm, descriptionEn: product.descriptionEn, descriptionAm: product.descriptionAm, image: product.image ?? '', price: String(product.price), compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '', promoPrice: product.promoPrice ? String(product.promoPrice) : '', ingredientsEn: product.ingredientsEn ?? '', ingredientsAm: product.ingredientsAm ?? '', allergens: Array.isArray(product.allergens) ? product.allergens.join(', ') : '', featured: product.featured, available: product.available, prepTime: product.prepTime ? String(product.prepTime) : '', sortOrder: String(product.sortOrder), isCombo: product.isCombo })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Edit</button>
                        <button onClick={async () => { await removeProduct(product.id); }} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
