import React, { useState } from 'react';
import { Calendar, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { generateGoogleCalendarUrl, type CalendarEventParams } from '../utils/calendar';

export interface CalendarEventTarget {
  title: string;
  venue_name?: string;
  city?: string;
  cinema_partner?: string | null;
  presale_start_at?: string | null;
  slug?: string;
  id?: string | number;
}

interface AddToCalendarDropdownProps {
  event: CalendarEventTarget;
  variant?: 'hero' | 'bar' | 'outline' | 'compact';
  label?: string;
  className?: string;
}

/**
 * Komponen Minimalis Pengingat Google Calendar (Direct 1-Click Action).
 * Langsung membuka Google Calendar di tab baru dengan alarm 30 menit sebelum presale dibuka.
 */
export const AddToCalendarDropdown: React.FC<AddToCalendarDropdownProps> = ({
  event,
  variant = 'hero',
  label = 'Ingatkan di Google Calendar',
  className,
}) => {
  const [hasAdded, setHasAdded] = useState(false);

  if (!event.presale_start_at) {
    return null;
  }

  const calendarParams: CalendarEventParams = {
    title: event.title,
    venueName: event.venue_name || 'Bioskop',
    city: event.city || 'Indonesia',
    cinemaPartner: event.cinema_partner,
    startAt: event.presale_start_at,
    durationMinutes: 30,
    reminderMinutesBefore: 30, // Pengingat otomatis 30 menit sebelum presale dibuka
    eventUrl:
      typeof window !== 'undefined'
        ? window.location.href
        : `https://sinemus.id/events/${event.slug || event.id}`,
  };

  const handleOpenGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(calendarParams);
    window.open(url, '_blank', 'noopener,noreferrer');
    setHasAdded(true);

    toast.success('Membuka Google Calendar...', {
      description:
        'Klik "Simpan" di Google Calendar untuk mengaktifkan notifikasi alarm H-30 menit.',
    });
  };

  // Button styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'hero':
        return hasAdded
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold px-4 py-2.5 text-xs sm:text-sm rounded-xl'
          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 px-4 py-2.5 text-xs sm:text-sm rounded-xl';
      case 'bar':
        return hasAdded
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold px-4 py-2 text-xs sm:text-sm rounded-xl'
          : 'bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20';
      case 'compact':
        return hasAdded
          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-600/50 px-3 py-1.5 text-xs rounded-lg'
          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 text-xs rounded-lg';
      case 'outline':
      default:
        return hasAdded
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 px-3.5 py-2 text-xs rounded-xl'
          : 'bg-transparent hover:bg-neutral-900 text-amber-400 border border-amber-500/40 hover:border-amber-400 px-3.5 py-2 text-xs rounded-xl';
    }
  };

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={handleOpenGoogleCalendar}
        className={cn(
          'inline-flex items-center gap-2 transition-all duration-200 active:scale-95',
          getButtonStyles()
        )}
        title="Buka Google Calendar untuk menyimpan pengingat otomatis"
        aria-label={hasAdded ? 'Pengingat tersimpan di Google Calendar' : label}
      >
        {hasAdded ? (
          <Check className="h-4 w-4 shrink-0 stroke-[2.5]" />
        ) : (
          <Calendar className="h-4 w-4 shrink-0" />
        )}
        <span>{hasAdded ? 'Tersimpan di Google Calendar' : label}</span>
        {!hasAdded && <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />}
      </button>
    </div>
  );
};
