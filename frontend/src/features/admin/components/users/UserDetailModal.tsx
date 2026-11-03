import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  ShoppingBag,
  Film,
  Ticket,
  Loader2,
  AlertCircle,
  Clock,
  Tv,
} from 'lucide-react';
import { useAdminUserDetailQuery } from '../../api';
import { UserPhoneLockBadge } from './UserPhoneLockBadge';

export interface UserDetailModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'tickets' | 'movies' | 'access';

export function UserDetailModal({
  userId,
  isOpen,
  onClose,
}: UserDetailModalProps): React.JSX.Element | null {
  const { data: user, isLoading, isError } = useAdminUserDetailQuery(userId);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [currentTimestamp] = useState(() => Date.now());

  if (!isOpen || !userId) return null;

  // Calculate age helper
  const calculateAge = (birthDateString: string | null): string => {
    if (!birthDateString) return 'Belum diisi';
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return birthDateString;
    const diff = currentTimestamp - birthDate.getTime();
    const ageDate = new Date(diff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${birthDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} (${age} tahun)`;
  };

  const totalOrdersCount = user?.total_orders_count ?? user?.total_paid_transactions ?? 0;
  const recentOrders = user?.recent_orders ?? [];
  const ticketOrders = user?.recent_ticket_transactions ?? [];
  const movieOrders = user?.recent_movie_transactions ?? [];
  const activeAccessList = user?.active_movie_access ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0D111A] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">
                Profil Pengguna & Audit
              </h2>
              <p className="text-[11px] text-neutral-400">
                Detail akun penonton, verifikasi identitas, dan audit riwayat pesanan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-xs">
          {isLoading && (
            <div className="flex h-56 flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              <span className="text-xs text-neutral-400">Memuat detail profil pengguna...</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                Gagal memuat detail pengguna. Silakan periksa koneksi atau coba lagi nanti.
              </span>
            </div>
          )}

          {user && (
            <>
              {/* Profile Card */}
              <div className="space-y-4 rounded-xl border border-neutral-800 bg-[#0D111A] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                  <div>
                    <span className="block text-base font-bold text-white">{user.name}</span>
                    <span className="font-mono text-[11px] text-neutral-400">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role === 'super_admin' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Super Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                        <User className="h-3 w-3" />
                        <span>Customer</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <Phone className="h-3.5 w-3.5" />
                      Nomor WhatsApp
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-white">
                        {user.phone_number || 'Belum diisi'}
                      </span>
                      <UserPhoneLockBadge
                        isLocked={user.is_phone_locked}
                        phoneNumber={user.phone_number}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <Mail className="h-3.5 w-3.5" />
                      Status Email
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                      Google OAuth Verified
                    </span>
                  </div>

                  {/* Birth Date & Age */}
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Tanggal Lahir & Verifikasi Usia
                    </span>
                    <span className="block font-medium text-white">
                      {calculateAge(user.birth_date)}
                    </span>
                  </div>

                  {/* Joined Date */}
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Terdaftar Sejak
                    </span>
                    <span className="block font-medium text-white">
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Chips */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-3 text-center">
                  <span className="text-[10px] text-neutral-400">Total Transaksi</span>
                  <p className="mt-0.5 text-base font-extrabold text-white">{totalOrdersCount}</p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-3 text-center">
                  <span className="text-[10px] text-neutral-400">Tiket Bioskop</span>
                  <p className="mt-0.5 text-base font-extrabold text-blue-400">
                    {user.paid_ticket_orders_count ?? ticketOrders.length}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-3 text-center">
                  <span className="text-[10px] text-neutral-400">Sewa Film VoD</span>
                  <p className="mt-0.5 text-base font-extrabold text-purple-400">
                    {user.paid_movie_orders_count ?? movieOrders.length}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-[#0D111A] p-3 text-center">
                  <span className="text-[10px] text-neutral-400">Streaming Aktif</span>
                  <p className="mt-0.5 text-base font-extrabold text-emerald-400">
                    {activeAccessList.length}
                  </p>
                </div>
              </div>

              {/* Transaction History Section with Tabs */}
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white">
                    <ShoppingBag className="h-4 w-4 text-amber-400" />
                    <span>Rekam Jejak Transaksi ({totalOrdersCount})</span>
                  </h3>

                  {/* Tabs Selector */}
                  <div className="flex flex-wrap items-center gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        activeTab === 'all'
                          ? 'bg-neutral-800 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Semua ({recentOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tickets')}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        activeTab === 'tickets'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Ticket className="h-3 w-3" />
                      <span>Tiket ({ticketOrders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('movies')}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        activeTab === 'movies'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Film className="h-3 w-3" />
                      <span>VoD ({movieOrders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('access')}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        activeTab === 'access'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Tv className="h-3 w-3" />
                      <span>Akses Aktif ({activeAccessList.length})</span>
                    </button>
                  </div>
                </div>

                {/* Tab 1: Semua Transaksi (Unified Recent Orders) */}
                {activeTab === 'all' && (
                  <>
                    {recentOrders.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0D111A]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-neutral-800 bg-[#080B10] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              <tr>
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Produk</th>
                                <th className="px-4 py-3">Nominal</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Tanggal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                              {recentOrders.map((order) => (
                                <tr key={order.order_id} className="hover:bg-neutral-800/30">
                                  <td className="px-4 py-3 font-mono font-medium text-white">
                                    {order.order_id}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                      {order.order_type === 'ticket' ? (
                                        <Ticket className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                      ) : (
                                        <Film className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                                      )}
                                      <span className="line-clamp-1 text-white">
                                        {order.item_title}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-medium text-white">
                                    Rp {order.net_amount.toLocaleString('id-ID')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        order.payment_status === 'paid'
                                          ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                          : order.payment_status === 'pending'
                                            ? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                                            : order.payment_status === 'expired'
                                              ? 'border border-neutral-700 bg-neutral-800 text-neutral-400'
                                              : 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
                                      }`}
                                    >
                                      {order.payment_status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-[11px] text-neutral-400">
                                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-neutral-500">
                        Belum ada riwayat transaksi untuk pengguna ini.
                      </div>
                    )}
                  </>
                )}

                {/* Tab 2: Tiket Bioskop */}
                {activeTab === 'tickets' && (
                  <>
                    {ticketOrders.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0D111A]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-neutral-800 bg-[#080B10] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              <tr>
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Event & Tiket</th>
                                <th className="px-4 py-3">Kode Tiket</th>
                                <th className="px-4 py-3">Kursi</th>
                                <th className="px-4 py-3">Nominal</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Check-in</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                              {ticketOrders.map((tx) => (
                                <tr key={tx.order_id} className="hover:bg-neutral-800/30">
                                  <td className="px-4 py-3 font-mono font-medium text-white">
                                    {tx.order_id}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="line-clamp-1 font-medium text-white">
                                      {tx.event_title}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-neutral-300">
                                    {tx.ticket_code ? (
                                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                        {tx.ticket_code}
                                      </span>
                                    ) : (
                                      <span className="text-neutral-500">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-white">
                                    {tx.ticket_quantity} tiket
                                  </td>
                                  <td className="px-4 py-3 font-mono text-white">
                                    Rp {tx.net_amount.toLocaleString('id-ID')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        tx.payment_status === 'paid'
                                          ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                          : tx.payment_status === 'pending'
                                            ? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                                            : 'border border-red-500/20 bg-red-500/10 text-red-400'
                                      }`}
                                    >
                                      {tx.payment_status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        tx.checkin_status === 'checked_in'
                                          ? 'bg-blue-500/20 text-blue-400'
                                          : 'bg-neutral-800 text-neutral-400'
                                      }`}
                                    >
                                      {tx.checkin_status === 'checked_in'
                                        ? 'CHECKED-IN'
                                        : 'PENDING'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-neutral-500">
                        Tidak ada riwayat transaksi tiket bioskop untuk pengguna ini.
                      </div>
                    )}
                  </>
                )}

                {/* Tab 3: Sewa Film VoD */}
                {activeTab === 'movies' && (
                  <>
                    {movieOrders.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0D111A]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-neutral-800 bg-[#080B10] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              <tr>
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Judul Film</th>
                                <th className="px-4 py-3">Nominal</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Tanggal Bayar</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                              {movieOrders.map((tx) => (
                                <tr key={tx.order_id} className="hover:bg-neutral-800/30">
                                  <td className="px-4 py-3 font-mono font-medium text-white">
                                    {tx.order_id}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-white">
                                    {tx.movie_title}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-white">
                                    Rp {tx.net_amount.toLocaleString('id-ID')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        tx.payment_status === 'paid'
                                          ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                          : 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
                                      }`}
                                    >
                                      {tx.payment_status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-[11px] text-neutral-400">
                                    {tx.paid_at
                                      ? new Date(tx.paid_at).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-neutral-500">
                        Tidak ada riwayat sewa film VoD untuk pengguna ini.
                      </div>
                    )}
                  </>
                )}

                {/* Tab 4: Hak Akses Streaming Aktif */}
                {activeTab === 'access' && (
                  <>
                    {activeAccessList.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {activeAccessList.map((acc) => (
                          <div
                            key={acc.id}
                            className="space-y-2 rounded-xl border border-neutral-800 bg-[#0D111A] p-4"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="block font-bold text-white">
                                  {acc.movie_title}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  ID Akses #{acc.id} • Movie ID #{acc.movie_id}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                <Clock className="h-3 w-3" />
                                <span>Sisa {acc.remaining_hours} jam</span>
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              <span>Berlaku hingga: </span>
                              <strong className="text-white">
                                {new Date(acc.rental_expires_at).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-neutral-500">
                        Pengguna tidak memiliki hak tonton VoD yang sedang aktif saat ini.
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-neutral-800 bg-[#0D111A] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 font-medium text-white transition hover:bg-neutral-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
