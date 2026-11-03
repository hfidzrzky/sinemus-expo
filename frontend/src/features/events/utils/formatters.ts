/**
 * Utility formater untuk metadata karya film dan event screening.
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

export interface NormalizedCastMember {
  actor: string;
  role: string | null;
}

/**
 * Normalisasi item cast dari format legacy string maupun objek terstruktur.
 */
export function normalizeCastMember(item: unknown): NormalizedCastMember {
  if (typeof item === 'string') {
    return { actor: item.trim(), role: null };
  }
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const actor = String(obj.actor ?? obj.name ?? '').trim();
    const roleRaw = obj.role ?? obj.character;
    const role = roleRaw ? String(roleRaw).trim() : null;
    return { actor, role };
  }
  return { actor: '', role: null };
}

/**
 * Format ringkasan teks jajaran pemeran untuk pratinjau kartu / preview.
 * Contoh: "Reza Rahadian (Habibie), Laura Basuki (Susi Susanti)"
 */
export function formatCastSummary(cast?: unknown[] | null): string {
  if (!Array.isArray(cast) || cast.length === 0) return '-';
  const formatted = cast
    .map((c) => {
      const { actor, role } = normalizeCastMember(c);
      if (!actor) return '';
      return role ? `${actor} (${role})` : actor;
    })
    .filter(Boolean);

  return formatted.length > 0 ? formatted.join(', ') : '-';
}
