import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Printer,
  Send,
  Lock,
  Ticket,
  Film,
  CreditCard,
  User,
  Tag,
  Loader2,
  Calendar,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminOrderDetailQuery, useResendOrderNotificationMutation } from '../../api';

export interface OrderDetailDrawerProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailDrawer({
  orderId,
  isOpen,
  onClose,
}: OrderDetailDrawerProps): React.JSX.Element | null {
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedGatewayId, setCopiedGatewayId] = useState(false);
  const [currentTimestamp] = useState(() => Date.now());

  const {
    data: order,
    isLoading,
    isError,
  } = useAdminOrderDetailQuery(orderId, isOpen && Boolean(orderId));

  const resendMutation = useResendOrderNotificationMutation();

  // Handle ESC key and background body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleCopy = (text: string, type: 'order' | 'gateway') => {
    navigator.clipboard.writeText(text);
    if (type === 'order') {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
      toast.success('Order ID berhasil disalin ke clipboard');
    } else {
      setCopiedGatewayId(true);
      setTimeout(() => setCopiedGatewayId(false), 2000);
      toast.success('ID Transaksi berhasil disalin');
    }
  };

  const handleResend = async (channel: 'all' | 'email' | 'whatsapp' = 'email') => {
    if (!orderId) return;
    try {
      await resendMutation.mutateAsync({ orderId, payload: { channel } });
      toast.success(
        'Notifikasi e-tiket & bukti transaksi berhasil dikirim ulang ke email penonton.'
      );
    } catch {
      toast.error('Gagal mengirim ulang email notifikasi. Silakan coba kembali.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null || Number.isNaN(amount)) {
      return 'Rp 0';
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatScheduleTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatAge = (birthDateStr?: string | null) => {
    if (!birthDateStr) return 'Identitas Terverifikasi';
    try {
      const bDate = new Date(birthDateStr);
      if (Number.isNaN(bDate.getTime())) return birthDateStr;
      const diff = currentTimestamp - bDate.getTime();
      const ageDate = new Date(diff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return `${age} Tahun (Lahir: ${bDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })})`;
    } catch {
      return birthDateStr;
    }
  };

  return createPortal(
    <div className="fixed inset-0 bottom-0 left-0 right-0 top-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel - Responsive width: full on mobile, max-xl on tablet/desktop */}
      <div className="relative z-10 flex h-full max-h-screen w-full flex-col border-l border-neutral-800/80 bg-[#0B0E14] text-neutral-200 shadow-2xl sm:max-w-lg md:max-w-xl">
        {/* Header - Stays sticky at the very top */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-800/80 bg-[#0D111A] px-5 py-4 sm:px-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Audit Detail Transaksi
            </span>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="font-mono text-sm font-extrabold text-white sm:text-base">
                {orderId || 'Detail Transaksi'}
              </h2>
              {orderId && (
                <button
                  type="button"
                  onClick={() => handleCopy(orderId, 'order')}
                  className="rounded p-1 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                  title="Salin Order ID"
                >
                  {copiedOrderId ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            title="Tutup (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body - Generous breathing room and minimalist spacing */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="mt-3 text-xs">Memuat detail transaksi snapshot...</p>
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-xs text-rose-300">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4" />
                <span>Gagal memuat detail transaksi</span>
              </div>
              <p className="mt-1.5 text-neutral-400">
                Terjadi kendala saat membaca data audit. Pastikan koneksi atau backend aktif.
              </p>
            </div>
          )}

          {!isLoading &&
            order &&
            (() => {
              const buyerName = order.buyer?.name || order.user_name || 'Guest';
              const buyerEmail = order.buyer?.email || order.user_email || '-';
              const buyerPhone = order.buyer?.phone_number || order.user_phone || null;
              const isPhoneLocked = order.buyer?.is_phone_locked ?? order.is_phone_locked ?? false;
              const birthDate = order.buyer?.birth_date || order.user_birth_date || null;

              const itemTitle =
                order.item_details?.event_title ||
                order.item_details?.movie_title ||
                order.item_title ||
                (order.order_type === 'ticket' ? 'Tiket Bioskop' : 'Sewa Film VoD');
              const venueName =
                order.item_details?.venue_name || order.venue_name || 'Bioskop Rekanan';
              const showTime = order.item_details?.show_time || order.show_time || null;
              const rawSeats = order.item_details?.seats || order.seat_codes || [];
              const seatCodes: string[] = Array.isArray(rawSeats)
                ? rawSeats.map((s) =>
                    typeof s === 'object' && s && 'seat_code' in s
                      ? String((s as { seat_code: string }).seat_code)
                      : String(s)
                  )
                : [];
              const ticketQuantity =
                order.item_details?.ticket_quantity ?? order.ticket_quantity ?? 1;

              const fulfillmentStatus =
                order.item_details?.fulfillment_status || order.fulfillment_status || 'unfulfilled';
              const cinemaBookingCode =
                order.item_details?.cinema_booking_code || order.cinema_booking_code || null;
              const cinemaPasscode =
                order.item_details?.cinema_passcode || order.cinema_passcode || null;
              const cinemaTicketNotes =
                order.item_details?.cinema_ticket_notes || order.cinema_ticket_notes || null;

              const grossAmount = order.financials?.gross_amount ?? order.gross_amount ?? 0;
              const discountAmount =
                order.financials?.discount_amount ?? order.discount_amount ?? 0;
              const netAmount = order.financials?.net_amount ?? order.net_amount ?? 0;
              const voucherCode = order.financials?.voucher?.code || order.voucher_code || null;

              const paymentType =
                order.payment_type || order.audit_logs?.payment_type || 'Payment Gateway';
              const gatewayTxId =
                order.audit_logs?.snap_token ||
                order.midtrans_transaction_id ||
                order.snap_token ||
                null;

              const accessDurationHours =
                order.access_duration_hours || order.item_details?.duration_minutes || 48;

              return (
                <>
                  {/* 1. Ringkasan Transaksi & Status */}
                  <div className="space-y-4 rounded-2xl border border-neutral-800/70 bg-[#0D111A]/80 p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                          Total Pembayaran Bersih
                        </span>
                        <div className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                          {formatCurrency(netAmount)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                        {order.payment_status === 'paid' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>PAID</span>
                          </span>
                        )}
                        {order.payment_status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>PENDING</span>
                          </span>
                        )}
                        {order.payment_status === 'expired' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/80 px-3 py-1 text-xs font-bold text-neutral-400">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>EXPIRED</span>
                          </span>
                        )}
                        {order.payment_status === 'failed' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>FAILED</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/90 px-3 py-1 text-xs font-medium text-neutral-300">
                          {order.order_type === 'ticket' ? (
                            <>
                              <Ticket className="h-3.5 w-3.5 text-amber-400" />
                              <span>Tiket Bioskop</span>
                            </>
                          ) : (
                            <>
                              <Film className="h-3.5 w-3.5 text-purple-400" />
                              <span>Sewa Film VoD</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-neutral-800/60 pt-4 text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-[11px] font-medium text-neutral-400">
                          Waktu Transaksi
                        </span>
                        <p className="mt-1 font-mono text-neutral-200">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-neutral-400">Waktu Paid</span>
                        <p
                          className={`mt-1 font-mono ${order.paid_at ? 'font-semibold text-emerald-400' : 'text-neutral-500'}`}
                        >
                          {order.paid_at ? formatDateTime(order.paid_at) : 'Menunggu Pembayaran'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Rincian Tiket / Film */}
                  <div className="space-y-4 rounded-2xl border border-neutral-800/70 bg-[#0D111A]/80 p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                        {order.order_type === 'ticket' ? (
                          <Ticket className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Film className="h-4 w-4 text-purple-400" />
                        )}
                        <span>
                          {order.order_type === 'ticket'
                            ? 'Rincian Tiket & Penayangan'
                            : 'Rincian Sewa Film Digital'}
                        </span>
                      </div>

                      {order.order_type === 'ticket' && (
                        <span className="text-xs font-semibold">
                          {fulfillmentStatus === 'fulfilled' && (
                            <span className="text-emerald-400">Siap Cetak Kiosk</span>
                          )}
                          {fulfillmentStatus === 'awaiting_cinema_ticket' && (
                            <span className="text-amber-400">Menunggu Tiket</span>
                          )}
                          {fulfillmentStatus === 'unfulfilled' && (
                            <span className="text-neutral-400">Belum Terinjeksi</span>
                          )}
                          {fulfillmentStatus === 'cancelled' && (
                            <span className="text-rose-400">Dibatalkan</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-neutral-400">
                        Judul Karya / Acara
                      </span>
                      <h4 className="mt-1 text-sm font-bold leading-snug text-white sm:text-base">
                        {itemTitle}
                      </h4>
                    </div>

                    {order.order_type === 'ticket' ? (
                      <>
                        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                          <div>
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                              <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                              Lokasi / Bioskop
                            </span>
                            <p className="mt-1 text-xs font-semibold text-neutral-100 sm:text-sm">
                              {venueName}
                            </p>
                          </div>
                          <div>
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                              Jadwal Penayangan
                            </span>
                            <p className="mt-1 font-mono text-xs font-semibold text-neutral-100 sm:text-sm">
                              {formatScheduleTime(showTime)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-medium text-neutral-400">
                            Kursi Dipesan ({ticketQuantity} tiket)
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {seatCodes && seatCodes.length > 0 ? (
                              seatCodes.map((seat) => (
                                <span
                                  key={seat}
                                  className="rounded-lg border border-neutral-700 bg-neutral-800/90 px-3 py-1 font-mono text-xs font-bold text-white shadow-sm"
                                >
                                  {seat}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-neutral-400">General Admission</span>
                            )}
                          </div>
                        </div>

                        {fulfillmentStatus === 'fulfilled' && (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                  Booking Code
                                </span>
                                <p className="mt-1 font-mono text-sm font-bold text-emerald-300">
                                  {cinemaBookingCode || '-'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                  Passcode / PIN
                                </span>
                                <p className="mt-1 font-mono text-sm font-bold text-emerald-300">
                                  {cinemaPasscode || '-'}
                                </p>
                              </div>
                            </div>
                            {cinemaTicketNotes && (
                              <p className="mt-2.5 border-t border-emerald-500/20 pt-2 text-[11px] italic text-neutral-300">
                                Catatan Kiosk: {cinemaTicketNotes}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                        <div>
                          <span className="text-[11px] font-medium text-neutral-400">
                            Masa Sewa
                          </span>
                          <p className="mt-1 text-sm font-semibold text-neutral-100">
                            {accessDurationHours} Jam Streaming
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-neutral-400">
                            Status Akses
                          </span>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Aktif & Terbuka</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Data Pembeli */}
                  <div className="space-y-4 rounded-2xl border border-neutral-800/70 bg-[#0D111A]/80 p-5 sm:p-6">
                    <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3 text-xs font-bold uppercase tracking-wider text-white">
                      <User className="h-4 w-4 text-blue-400" />
                      <span>Data Pembeli</span>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-[11px] font-medium text-neutral-400">
                          Nama Lengkap
                        </span>
                        <p
                          className="mt-1 text-xs font-semibold text-white sm:text-sm"
                          title={buyerName}
                        >
                          {buyerName}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-medium text-neutral-400">
                          Email Pembeli
                        </span>
                        <p
                          className="mt-1 truncate font-mono text-xs text-neutral-200 sm:text-sm"
                          title={buyerEmail}
                        >
                          {buyerEmail}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-medium text-neutral-400">
                          Nomor WhatsApp
                        </span>
                        <div className="mt-1 flex items-center gap-2 font-mono text-xs text-neutral-200 sm:text-sm">
                          <span>{buyerPhone || '-'}</span>
                          {isPhoneLocked && (
                            <span
                              title="Nomor Terverifikasi & Terkunci"
                              className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400"
                            >
                              <Lock className="h-3 w-3" />
                              <span>Terkunci</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-medium text-neutral-400">
                          Verifikasi Penonton
                        </span>
                        <p
                          className="mt-1 text-xs text-neutral-200 sm:text-sm"
                          title={formatAge(birthDate)}
                        >
                          {formatAge(birthDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Rincian Finansial & Gateway */}
                  <div className="space-y-4 rounded-2xl border border-neutral-800/70 bg-[#0D111A]/80 p-5 sm:p-6">
                    <div className="flex items-center gap-2 border-b border-neutral-800/60 pb-3 text-xs font-bold uppercase tracking-wider text-white">
                      <CreditCard className="h-4 w-4 text-emerald-400" />
                      <span>Rincian Finansial & Gateway</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span>Harga Kotor (Gross)</span>
                        <span className="font-mono text-xs font-medium text-neutral-200 sm:text-sm">
                          {formatCurrency(grossAmount)}
                        </span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-rose-400">
                          <span className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5" />
                            <span>Diskon Voucher ({voucherCode || 'Promo'})</span>
                          </span>
                          <span className="font-mono text-xs font-medium sm:text-sm">
                            - {formatCurrency(discountAmount)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-neutral-800/60 pt-3 text-xs font-bold text-white">
                        <span>Total Pembayaran Bersih</span>
                        <span className="font-mono text-sm font-extrabold text-emerald-400 sm:text-base">
                          {formatCurrency(netAmount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 border-t border-neutral-800/60 pt-4 text-xs sm:grid-cols-2">
                        <div>
                          <span className="text-[11px] font-medium text-neutral-400">
                            Kanal Pembayaran
                          </span>
                          <p className="mt-1 font-semibold text-neutral-200">{paymentType}</p>
                        </div>

                        <div>
                          <span className="text-[11px] font-medium text-neutral-400">
                            ID Transaksi Gateway
                          </span>
                          <div className="mt-1 flex items-center gap-2 font-mono text-xs text-neutral-300">
                            <span className="max-w-[160px] truncate" title={gatewayTxId || '-'}>
                              {gatewayTxId || '-'}
                            </span>
                            {gatewayTxId && (
                              <button
                                type="button"
                                onClick={() => handleCopy(gatewayTxId, 'gateway')}
                                className="rounded p-1 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                                title="Salin ID Transaksi"
                              >
                                {copiedGatewayId ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Aksi Operasional - Responsive buttons */}
                  <div className="rounded-2xl border border-neutral-800/70 bg-[#0D111A]/80 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleResend('email')}
                        disabled={resendMutation.isPending || order.payment_status !== 'paid'}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 py-3 text-xs font-semibold text-white transition hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {resendMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span>Kirim Ulang Tiket</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-700/80 bg-neutral-800/80 px-4 py-3 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-700 hover:text-white active:scale-[0.98]"
                      >
                        <Printer className="h-4 w-4 text-neutral-400" />
                        <span>Cetak Bukti</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-neutral-800/80 bg-[#0D111A] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-700 active:scale-[0.98] sm:w-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
