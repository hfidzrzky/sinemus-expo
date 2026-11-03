import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan nama class Tailwind dengan resolusi konflik utilitas
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke mata uang Rupiah Indonesia (IDR)
 * Contoh: 35000 -> "Rp 35.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ISO ke format pembacaan Indonesia
 * Contoh: "2026-09-15T19:30:00Z" -> "Selasa, 15 September 2026, 19:30 WIB"
 */
export function formatDateIndonesia(
  isoDateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
    ...options,
  };

  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat('id-ID', defaultOptions).format(date);
  } catch {
    return isoDateString;
  }
}

/**
 * Menghitung sisa detik antara server_time dan waktu kadaluarsa (SSOT)
 * Memastikan perhitungan tidak bergantung pada jam lokal pengguna (Anti-Clock Skew).
 */
export function calculateRemainingSeconds(serverTimeIso: string, expiresAtIso: string): number {
  try {
    const serverTimestamp = new Date(serverTimeIso).getTime();
    const expiresTimestamp = new Date(expiresAtIso).getTime();
    const diffInSeconds = Math.floor((expiresTimestamp - serverTimestamp) / 1000);
    return Math.max(0, diffInSeconds);
  } catch {
    return 0;
  }
}

/**
 * Format detik ke representasi jam:menit:detik
 * Contoh: 900 detik -> "15:00"
 */
export function formatCountdownTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Menyensor bagian tengah nomor telepon dengan karakter '*'
 * Contoh: "081234567890" -> "0812****7890"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'Secured';
  const clean = phone.trim().replace(/\s+/g, '');
  if (clean.length < 8) return clean;

  const prefixLength = clean.startsWith('+62') ? 5 : 4;
  const suffixLength = 4;

  if (clean.length <= prefixLength + suffixLength) {
    return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
  }

  const prefix = clean.slice(0, prefixLength);
  const suffix = clean.slice(-suffixLength);
  const maskLength = Math.max(4, clean.length - prefixLength - suffixLength);
  const asterisks = '*'.repeat(maskLength);

  return `${prefix}${asterisks}${suffix}`;
}
