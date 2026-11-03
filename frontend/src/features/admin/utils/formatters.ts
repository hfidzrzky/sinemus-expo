/**
 * Utility formatters untuk domain admin Sinemus.
 */

/**
 * Format durasi video ke format ringkas dan ramah penonton/admin.
 * Contoh:
 * - 600 detik / 10 menit -> "10m"
 * - 7800 detik / 130 menit -> "2j 10m"
 * - 45 detik -> "45d"
 */
export function formatStreamDuration(secondsOrMinutes?: number | null, isMinutes = false): string {
  if (!secondsOrMinutes || secondsOrMinutes <= 0) return '';
  const totalSeconds = isMinutes ? Math.round(secondsOrMinutes * 60) : Math.round(secondsOrMinutes);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}j ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}j`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}d`;
}
