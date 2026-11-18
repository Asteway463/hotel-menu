'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Restaurant {
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
  socials: Record<string, string | undefined> | null;
  openingHours: Record<string, { open: string; close: string } | null> | null;
  currency: string;
  wifiSsid: string | null;
  wifiPassword: string | null;
}

export default function AdminSettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/restaurants');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load restaurant');
        return;
      }
      setRestaurant(data.restaurant ?? null);
      setLoading(false);
    }
    void load();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!restaurant) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      slug: restaurant.slug,
      nameEn: String(form.get('nameEn') ?? restaurant.nameEn),
      nameAm: String(form.get('nameAm') ?? restaurant.nameAm),
      taglineEn: String(form.get('taglineEn') ?? restaurant.taglineEn),
      taglineAm: String(form.get('taglineAm') ?? restaurant.taglineAm),
      storyEn: String(form.get('storyEn') ?? restaurant.storyEn),
      storyAm: String(form.get('storyAm') ?? restaurant.storyAm),
      address: restaurant.address ?? undefined,
      phone: restaurant.phone ?? undefined,
      email: restaurant.email ?? undefined,
      socials: {
        instagram: restaurant.socials?.instagram,
        facebook: restaurant.socials?.facebook,
        twitter: restaurant.socials?.twitter,
        tiktok: restaurant.socials?.tiktok,
      },
      openingHours: restaurant.openingHours ?? undefined,
      currency: restaurant.currency,
    };
    const res = await fetch('/api/restaurants', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? 'Failed to save');
      return;
    }
    setRestaurant(data.restaurant ?? restaurant);
    setSaved(true);
    setError(null);
  }

  if (loading) return <p className="text-white/70">Loading settings…</p>;

  if (!restaurant) {
    return <p className="text-white/70">Restaurant not found.</p>;
  }

  const socialKeys = ['instagram', 'facebook', 'twitter', 'tiktok'] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-white/60">Restaurant profile, network and branding.</p>
      </div>

      {error ? <p className="rounded-xl bg-accent/20 px-4 py-3 text-red-200">{error}</p> : null}
      {saved ? <p className="rounded-xl bg-green-500/20 px-4 py-3 text-green-200">Saved.</p> : null}

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSave}
        className="space-y-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
      >
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold text-white">Branding</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Restaurant name (EN)</span>
              <input
                name="nameEn"
                defaultValue={restaurant.nameEn}
                className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Restaurant name (Am)</span>
              <input
                name="nameAm"
                defaultValue={restaurant.nameAm}
                className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">Tagline (EN)</span>
            <input
              name="taglineEn"
              defaultValue={restaurant.taglineEn}
              className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">Story (EN)</span>
            <textarea
              name="storyEn"
              defaultValue={restaurant.storyEn}
              rows={3}
              className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold text-white">Contact</legend>
          <label className="block">
            <span className="mb-1 block text-sm text-white/70">Address</span>
            <input
              defaultValue={restaurant.address ?? ''}
              className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Phone</span>
              <input
                defaultValue={restaurant.phone ?? ''}
                className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Email</span>
              <input
                defaultValue={restaurant.email ?? ''}
                className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold text-white">Wi-Fi (customer connection)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">SSID</span>
              <input
                name="wifiSsid"
                defaultValue={restaurant.wifiSsid ?? ''}
                className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-white/70">Password</span>
              <input
                name="wifiPassword"
                defaultValue={restaurant.wifiPassword ?? ''}
                className="w-full rounded-xl bg-white/5 px-4 py-2 text-white"
              />
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90"
        >
          Save settings
        </button>
      </motion.form>
    </div>
  );
}
