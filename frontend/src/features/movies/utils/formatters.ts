/**
 * Utility formater untuk metadata karya film VoD.
 */

/**
 * Format durasi menit ke format sinematik ringkas dan humanis.
 * Contoh:
 * - 125 -> "2j 5m"
 * - 120 -> "2j"
 * - 45  -> "45m"
 * - 0 / undefined -> ""
 */
export function formatMovieDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}j ${remainingMinutes}m`;
  }
  if (hours > 0) {
    return `${hours}j`;
  }
  return `${remainingMinutes}m`;
}
