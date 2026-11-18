'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes: string | null;
  addons: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  tax: number;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  customerNotes: string | null;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_FLOW = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load orders');
      setOrders(data.orders ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(orderId: string, status: string, paymentStatus?: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, paymentStatus }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Failed to update order');
    }
    await load();
  }

  if (loading) return <p className="text-white/70">Loading orders…</p>;
  if (error) return <p className="text-red-300">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Orders</h1>
          <p className="mt-1 text-white/60">Incoming orders and kitchen queue.</p>
        </div>
        <button
          onClick={() => void load()}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl bg-white/5 p-8 text-center text-white/60 ring-1 ring-white/10">
          No orders yet.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-bold text-white">
                    #{order.orderNumber}
                  </p>
                  <p className="text-sm text-white/60">
                    {new Date(order.createdAt).toLocaleString()} ·{' '}
                    {order.type}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.paymentStatus === 'PAID'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === 'CANCELLED'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-primary/20 text-primary-soft'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-sm text-white/80"
                  >
                    <span>
                      {item.quantity}× {item.productName}
                    </span>
                    <span className="font-semibold text-white">
                      {item.total} ETB
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {STATUS_FLOW.filter((s) => s !== order.status).map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      void updateStatus(order.id, s, s === 'PAID' ? 'PAID' : order.paymentStatus)
                    }
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                  >
                    Mark {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
                {order.status !== 'CANCELLED' && (
                  <button
                    onClick={() =>
                      void updateStatus(order.id, 'CANCELLED', order.paymentStatus)
                    }
                    className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
