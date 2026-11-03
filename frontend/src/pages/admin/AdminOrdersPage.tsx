import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Ticket,
  Film,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminOrdersQuery,
  OrderFilterBar,
  OrderDetailDrawer,
  type AdminOrderItem,
} from '@/features/admin';

export interface AdminOrdersPageProps {
  onNavigate?: (path: string) => void;
}

export function AdminOrdersPage(_props: AdminOrdersPageProps): React.JSX.Element {
  // Filter states
  const [selectedType, setSelectedType] = useState<'all' | 'ticket' | 'movie_rental'>('all');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'pending' | 'paid' | 'expired' | 'failed'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Drawer state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch orders with current filters
  const { data, isLoading, isError, refetch } = useAdminOrdersQuery({
    type: selectedType,
    status: selectedStatus,
    search: searchTerm,
    start_date: startDate,
    end_date: endDate,
    page,
    per_page: perPage,
  });

  const orders = useMemo(() => data?.orders ?? [], [data?.orders]);
  const meta = data?.meta || {
    current_page: 1,
    from: 0,
    last_page: 1,
    per_page: perPage,
    to: 0,
    total: 0,
  };

  // Summary calculation for current page/dataset
  const summaryStats = useMemo(() => {
    const totalNet = orders.reduce(
      (sum, o) => (o.payment_status === 'paid' ? sum + (Number(o.net_amount) || 0) : sum),
      0
    );
    const paidCount = orders.filter((o) => o.payment_status === 'paid').length;
    const pendingCount = orders.filter((o) => o.payment_status === 'pending').length;
    const expiredCount = orders.filter((o) => o.payment_status === 'expired').length;
    const failedCount = orders.filter((o) => o.payment_status === 'failed').length;
    return { totalNet, paidCount, pendingCount, expiredCount, failedCount };
  }, [orders]);

  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleOpenDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDrawerOpen(false);
    setSelectedOrderId(null);
  };

  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    try {
      setIsExporting(true);

      const headers = [
        'Order ID',
        'Tipe Pesanan',
        'Waktu Transaksi',
        'Waktu Paid',
        'Nama Pembeli',
        'Email Google',
        'Nomor WhatsApp',
        'Produk / Acara',
        'Kursi / Masa Sewa',
        'Harga Kotor (Rp)',
        'Diskon (Rp)',
        'Nominal Bersih (Rp)',
        'Status Pembayaran',
        'Kanal Pembayaran',
        'Status Pemenuhan Tiket',
      ];

      const rows = orders.map((o) => [
        `"${o.order_id}"`,
        `"${o.order_type === 'ticket' ? 'Tiket Bioskop' : 'Sewa VoD'}"`,
        `"${o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : '-'}"`,
        `"${o.paid_at ? new Date(o.paid_at).toLocaleString('id-ID') : '-'}"`,
        `"${o.user_name || '-'}"`,
        `"${o.user_email || '-'}"`,
        `"${o.user_phone || '-'}"`,
        `"${(o.item_title || '-').replace(/"/g, '""')}"`,
        `"${Array.isArray(o.seat_codes) && o.seat_codes.length > 0 ? o.seat_codes.join(', ') : o.order_type === 'ticket' ? 'General Admission' : 'Sewa Film VoD'}"`,
        Number(o.gross_amount) || 0,
        Number(o.discount_amount) || 0,
        Number(o.net_amount) || 0,
        `"${(o.payment_status || 'pending').toUpperCase()}"`,
        `"${o.payment_type || '-'}"`,
        `"${o.fulfillment_status || '-'}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `sinemus-audit-transaksi-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Laporan transaksi berhasil diekspor ke CSV.');
    } catch {
      toast.error('Gagal mengekspor laporan transaksi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Riwayat Transaksi & Audit Keuangan
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Audit kepatuhan finansial transaksi untuk tiket bioskop (SNM-TKT) dan sewa film VoD
            (SNM-VOD).
          </p>
        </div>

        {/* Quick Summary Pill Box */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-neutral-800 bg-[#0B0E14] px-3.5 py-2">
            <span className="block text-[10px] font-medium text-neutral-400">
              Omzet Paid (Tampil)
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              Rp {summaryStats.totalNet.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-[#0B0E14] px-3.5 py-2">
            <span className="block text-[10px] font-medium text-neutral-400">Rasio Sukses</span>
            <span className="font-mono text-xs font-bold text-white">
              {summaryStats.paidCount} / {orders.length} Paid
            </span>
          </div>
          {summaryStats.failedCount > 0 && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2">
              <span className="block text-[10px] font-medium text-rose-300">Gagal / Failed</span>
              <span className="font-mono text-xs font-bold text-rose-400">
                {summaryStats.failedCount} Transaksi
              </span>
            </div>
          )}
          {summaryStats.pendingCount > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2">
              <span className="block text-[10px] font-medium text-amber-300">Pending</span>
              <span className="font-mono text-xs font-bold text-amber-400">
                {summaryStats.pendingCount} Transaksi
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar Component */}
      <OrderFilterBar
        selectedType={selectedType}
        onTypeChange={(type) => {
          setSelectedType(type);
          setPage(1);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(status) => {
          setSelectedStatus(status);
          setPage(1);
        }}
        searchTerm={searchTerm}
        onSearchChange={(search) => {
          setSearchTerm(search);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(start) => {
          setStartDate(start);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(end) => {
          setEndDate(end);
          setPage(1);
        }}
        onResetFilters={handleResetFilters}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
        totalOrdersCount={orders.length}
      />

      {/* Transactions Table Container */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-neutral-800 bg-[#0D111A] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span>Order ID & Waktu</span>
                    <ArrowUpDown className="h-3 w-3 text-neutral-500" />
                  </div>
                </th>
                <th className="px-4 py-4">Pembeli & No. WhatsApp</th>
                <th className="px-4 py-4">Item / Produk Dipesan</th>
                <th className="px-4 py-4">Nominal Bersih</th>
                <th className="px-4 py-4">Status Transaksi</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <span className="text-xs">Memuat data audit transaksi...</span>
                    </div>
                  </td>
                </tr>
              )}

              {isError && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6" />
                      <span className="text-xs font-semibold">Gagal memuat riwayat transaksi</span>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-1 rounded-lg bg-neutral-800 px-3 py-1 text-xs text-white hover:bg-neutral-700"
                      >
                        Muat Ulang
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-10 w-10 text-neutral-600" />
                      <p className="text-sm font-bold text-neutral-400">
                        Tidak ada transaksi ditemukan
                      </p>
                      <p className="max-w-sm text-xs text-neutral-500">
                        Coba sesuaikan filter pencarian, status settlement, atau rentang tanggal di
                        atas.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs font-bold text-blue-400 hover:underline"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                orders.map((order: AdminOrderItem) => (
                  <tr
                    key={order.order_id}
                    onClick={() => handleOpenDetail(order.order_id)}
                    className="cursor-pointer transition hover:bg-neutral-900/50"
                  >
                    {/* Order ID & Timestamps */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white transition-colors hover:text-blue-400">
                          {order.order_id}
                        </span>
                        {order.order_type === 'ticket' ? (
                          <span
                            title="Tiket Bioskop"
                            className="rounded bg-blue-500/10 p-0.5 text-blue-400"
                          >
                            <Ticket className="h-3 w-3" />
                          </span>
                        ) : (
                          <span
                            title="Sewa Film VoD"
                            className="rounded bg-purple-500/10 p-0.5 text-purple-400"
                          >
                            <Film className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 block text-[10px] text-neutral-500">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </span>
                    </td>

                    {/* Pembeli & Phone */}
                    <td className="px-4 py-4">
                      <span className="block font-semibold text-white">{order.user_name}</span>
                      <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-neutral-400">
                        <span>{order.user_phone || '-'}</span>
                        <span title="Nomor Terkunci Permanen">
                          <Lock className="h-2.5 w-2.5 text-emerald-400" />
                        </span>
                      </div>
                      <span className="block max-w-[160px] truncate text-[10px] text-neutral-500">
                        {order.user_email}
                      </span>
                    </td>

                    {/* Item Title & Seat / Duration */}
                    <td className="px-4 py-4">
                      <span className="block max-w-[220px] truncate font-medium text-white">
                        {order.item_title}
                      </span>
                      {order.order_type === 'ticket' ? (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-400">
                          <span className="font-mono font-bold text-blue-400">
                            {order.seat_codes && order.seat_codes.length > 0
                              ? order.seat_codes.join(', ')
                              : 'General Admission'}
                          </span>
                          <span>•</span>
                          <span className="max-w-[120px] truncate">
                            {order.venue_name || 'Cinema Partner'}
                          </span>
                        </div>
                      ) : (
                        <span className="block text-[10px] font-medium text-purple-400">
                          Akses Streaming Digital (VoD)
                        </span>
                      )}
                    </td>

                    {/* Nominal Bersih & Payment Type */}
                    <td className="px-4 py-4">
                      <strong className="block font-mono text-sm text-emerald-400">
                        Rp {(Number(order.net_amount) || 0).toLocaleString('id-ID')}
                      </strong>
                      <span className="block text-[10px] text-neutral-500">
                        {order.payment_type || 'Gateway'}
                        {Number(order.discount_amount) > 0 && (
                          <span className="ml-1 text-rose-400">
                            (-{(Number(order.discount_amount) || 0).toLocaleString('id-ID')})
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Payment Status & Fulfillment Pill */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {order.payment_status === 'paid' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>PAID</span>
                          </span>
                        )}
                        {order.payment_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            <Clock className="h-3 w-3" />
                            <span>PENDING</span>
                          </span>
                        )}
                        {order.payment_status === 'expired' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>EXPIRED</span>
                          </span>
                        )}
                        {order.payment_status === 'failed' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                            <XCircle className="h-3 w-3" />
                            <span>FAILED</span>
                          </span>
                        )}

                        {/* Extra Fulfillment Status for Tickets */}
                        {order.order_type === 'ticket' && order.payment_status === 'paid' && (
                          <div>
                            {order.fulfillment_status === 'fulfilled' && (
                              <span className="inline-block text-[9px] font-bold text-emerald-400">
                                ✓ Tiket Terinjeksi
                              </span>
                            )}
                            {order.fulfillment_status === 'awaiting_cinema_ticket' && (
                              <span className="inline-block text-[9px] font-bold text-amber-400">
                                ⏳ Menunggu Tiket
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(order.order_id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800/80 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 transition hover:border-neutral-600 hover:bg-neutral-700 hover:text-white"
                        title="Lihat Detail Transaksi & Audit Log"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer Meta */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-800 bg-[#0D111A] px-6 py-4 sm:flex-row">
          <div className="text-xs text-neutral-400">
            Menampilkan <strong className="font-semibold text-white">{meta.from || 0}</strong> -{' '}
            <strong className="font-semibold text-white">{meta.to || 0}</strong> dari{' '}
            <strong className="font-semibold text-white">{meta.total}</strong> transaksi
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1 || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-2 text-xs font-bold text-neutral-300">
              Halaman {meta.current_page} dari {meta.last_page || 1}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page >= meta.last_page || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-[#0B0E14] px-3 py-1.5 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Over Drawer Detail */}
      <OrderDetailDrawer
        orderId={selectedOrderId}
        isOpen={isDrawerOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
