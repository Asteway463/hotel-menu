import { redirect } from 'next/navigation';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    redirect('/login?from=/admin');
  }

  return (
    <div className="min-h-screen bg-secondary text-cream">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-secondary/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/admin" className="font-display text-xl font-bold text-white">
            🍔 Burger House
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/admin" className="text-white/70 hover:text-white">Overview</a>
            <a href="/admin/menu" className="text-white/70 hover:text-white">Menu</a>
            <a href="/admin/orders" className="text-white/70 hover:text-white">Orders</a>
            <a href="/admin/settings" className="text-white/70 hover:text-white">Settings</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
