import { redirect } from 'next/navigation';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { getDailyStats } from '@/server/services/orders.service';

export default async function AdminDashboardPage() {
  const ctx = await getAuthContext();
  if (!isAuthenticated(ctx) || !ctx.restaurantId) {
    redirect('/login?from=/admin');
  }

  const stats = await getDailyStats(ctx.restaurantId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-white/60">
          Daily sales and restaurant performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-sm text-white/60">Orders today</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">
            {stats.orders}
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-sm text-white/60">Revenue today</p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {stats.revenue} ETB
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-sm text-white/60">Items sold today</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">
            {stats.itemsSold}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
        <h2 className="font-display text-xl font-semibold text-white">
          Recent paid orders
        </h2>
        {stats.paidOrders.length === 0 ? (
          <p className="mt-4 text-white/60">No paid orders yet today.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {stats.paidOrders.slice(0, 10).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm"
              >
                <span className="text-white/80">#{o.orderNumber}</span>
                <span className="font-semibold text-white">{o.total} ETB</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
