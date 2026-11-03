import React from 'react';
import { ArrowRight, Ticket, Film, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import type { AdminOrderItem } from '../../types';

export interface RecentOrdersWidgetProps {
  orders?: AdminOrderItem[];
  onNavigate: (path: string) => void;
  isLoading?: boolean;
}

function formatOrderDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatOrderTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })} WIB`;
  } catch {
    return '';
  }
}

export function RecentOrdersWidget({
  orders = [],
  onNavigate,
  isLoading = false,
}: RecentOrdersWidgetProps): React.JSX.Element {
  const getStatusBadge = (status: AdminOrderItem['payment_status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>PAID</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            <Clock className="h-3 w-3" />
            <span>PENDING</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
            <AlertCircle className="h-3 w-3" />
            <span>EXPIRED</span>
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
            <XCircle className="h-3 w-3" />
            <span>FAILED</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0B0E14]">
      <div className="flex flex-col gap-2.5 border-b border-neutral-800/80 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h2 className="font-display text-sm font-extrabold text-white">
            Transaksi Penjualan Terbaru
          </h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Aktivitas checkout tiket bioskop & sewa film real-time penonton.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/admin/orders')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066FF] transition-colors hover:underline"
        >
          Lihat Semua Transaksi
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-xs">
          <thead className="bg-[#0D111A] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="px-3.5 py-3 sm:px-6">Order ID & Produk</th>
              <th className="px-3 py-3 sm:px-4">Penonton</th>
              <th className="px-3 py-3 sm:px-4">Nominal</th>
              <th className="px-3 py-3 sm:px-4">Status</th>
              <th className="px-3.5 py-3 text-right sm:px-6">Tanggal & Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-500">
                  <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <span className="text-[11px]">Memuat transaksi terbaru...</span>
                </td>
              </tr>
            )}

            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[11px] text-neutral-500">
                  Belum ada transaksi tiket atau sewa film di sistem.
                </td>
              </tr>
            )}

            {!isLoading &&
              orders.map((order) => {
                const buyerName = order.user_name || order.buyer_name || 'Guest';
                const buyerEmail = order.user_email || order.buyer_email || '-';

                return (
                  <tr
                    key={order.order_id}
                    onClick={() => onNavigate('/admin/orders')}
                    className="cursor-pointer transition-colors hover:bg-neutral-900/40"
                  >
                    <td className="px-3.5 py-3 sm:px-6 sm:py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400">
                          {order.order_type === 'ticket' ? (
                            <Ticket className="h-3.5 w-3.5 text-blue-400" />
                          ) : (
                            <Film className="h-3.5 w-3.5 text-neutral-300" />
                          )}
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-white">
                            {order.order_id}
                          </span>
                          <p className="line-clamp-1 max-w-[180px] text-[11px] text-neutral-400 sm:max-w-[200px]">
                            {order.item_title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                      <span className="font-medium text-white">{buyerName}</span>
                      <span className="block text-[10px] text-neutral-400">{buyerEmail}</span>
                    </td>
                    <td className="px-3 py-3 font-bold text-white sm:px-4 sm:py-3.5">
                      Rp {Number(order.net_amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                      {getStatusBadge(order.payment_status)}
                    </td>
                    <td className="px-3.5 py-3 text-right text-[11px] sm:px-6 sm:py-3.5">
                      <span className="block font-medium text-white">
                        {formatOrderDate(order.created_at)}
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        {formatOrderTime(order.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
