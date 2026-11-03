/**
 * Utility kalender untuk pengingat presale (Google Calendar & Apple/iCal .ics).
 * Mengikuti spesifikasi RFC 5545 dengan alarm 30 menit sebelum event dibuka.
 */

export interface CalendarEventParams {
  title: string;
  venueName?: string;
  city?: string;
  cinemaPartner?: string | null;
  startAt: string; // ISO-8601 string
  eventUrl?: string;
  durationMinutes?: number;
  reminderMinutesBefore?: number;
}

/**
 * Format Date ke string RFC 5545 UTC: YYYYMMDDTHHmmssZ
 */
export function formatUtcDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape string untuk format RFC 5545 (.ics)
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate Google Calendar Template URL
 */
export function generateGoogleCalendarUrl({
  title,
  venueName = 'Bioskop',
  city = 'Indonesia',
  cinemaPartner,
  startAt,
  eventUrl = typeof window !== 'undefined' ? window.location.href : 'https://sinemus.id',
  durationMinutes = 30,
}: CalendarEventParams): string {
  const startDate = new Date(startAt);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const startUtc = formatUtcDateTime(startDate);
  const endUtc = formatUtcDateTime(endDate);

  const eventTitle = `[Presale] Tiket Bioskop: ${title}`;
  const location = `${venueName}, ${city}`;

  const partnerInfo = cinemaPartner ? `\nPartner Bioskop: ${cinemaPartner}` : '';
  const details = `Pemesanan tiket presale resmi film "${title}" telah dibuka di Sinemus Platform! Segera pilih kursi terbaik Anda sebelum kehabisan.${partnerInfo}\nLokasi: ${location}\n\nTautan Pemesanan Langsung:\n${eventUrl}`;

  const queryParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: `${startUtc}/${endUtc}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${queryParams.toString()}`;
}

/**
 * Generate string RFC 5545 format (.ics) dengan alarm VALARM 30 menit sebelum event
 */
export function generateIcsFileContent({
  title,
  venueName = 'Bioskop',
  city = 'Indonesia',
  cinemaPartner,
  startAt,
  eventUrl = typeof window !== 'undefined' ? window.location.href : 'https://sinemus.id',
  durationMinutes = 30,
  reminderMinutesBefore = 30,
}: CalendarEventParams): string {
  const startDate = new Date(startAt);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();

  const startUtc = formatUtcDateTime(startDate);
  const endUtc = formatUtcDateTime(endDate);
  const nowUtc = formatUtcDateTime(now);
  const uid = `sinemus-presale-${startDate.getTime()}-${Math.random().toString(36).slice(2, 9)}@sinemus.id`;

  const eventTitle = `[Presale] Tiket Bioskop: ${title}`;
  const location = `${venueName}, ${city}`;
  const partnerInfo = cinemaPartner ? `\\nPartner Bioskop: ${cinemaPartner}` : '';
  const details = `Pemesanan tiket presale resmi film "${title}" telah dibuka di Sinemus Platform! Segera pilih kursi terbaik Anda sebelum kehabisan.${partnerInfo}\\nLokasi: ${location}\\n\\nTautan Pemesanan:\\n${eventUrl}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sinemus Platform//Presale Calendar//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${escapeIcsText(eventTitle)}`,
    `DESCRIPTION:${details}`,
    `LOCATION:${escapeIcsText(location)}`,
    `URL:${eventUrl}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Pengingat Pembukaan Presale Tiket Sinemus',
    `TRIGGER:-PT${reminderMinutesBefore}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Trigger download file .ics langsung di browser
 */
export function downloadIcsFile(params: CalendarEventParams): void {
  const icsContent = generateIcsFileContent(params);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const safeFilename = `presale-${params.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
