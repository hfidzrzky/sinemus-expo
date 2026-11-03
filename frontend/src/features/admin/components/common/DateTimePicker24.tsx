import React from 'react';
import { X } from 'lucide-react';

export interface DateTimePicker24Props {
  value?: string | null;
  onChange: (val: string | null) => void;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  defaultTime?: string;
  className?: string;
}

/**
 * Ekstraksi string tanggal (YYYY-MM-DD), jam (HH), dan menit (mm) secara aman dalam zona waktu Asia/Jakarta (WIB).
 */
function parseDateTimeParts(val?: string | null): { date: string; hour: string; minute: string } {
  if (!val) return { date: '', hour: '00', minute: '00' };

  const trimmed = val.trim();

  // Jika string memiliki indikator timezone (akhiran 'Z'/'z' atau offset numerik '+HH:mm'/'-HH:mm')
  const hasTimezoneIndicator = /([zZ]|[+-]\d{2}(?::?\d{2})?)$/.test(trimmed);

  if (hasTimezoneIndicator) {
    try {
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        // Format ke zona waktu operasional Sinemus: Asia/Jakarta (WIB)
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        const parts = formatter.formatToParts(parsedDate);
        let year = '';
        let month = '';
        let day = '';
        let hour = '';
        let minute = '';

        for (const part of parts) {
          if (part.type === 'year') year = part.value;
          else if (part.type === 'month') month = part.value;
          else if (part.type === 'day') day = part.value;
          else if (part.type === 'hour') hour = part.value;
          else if (part.type === 'minute') minute = part.value;
        }

        // Normalisasi edge case Intl: jam 24 tengah malam menjadi 00
        if (hour === '24') hour = '00';

        if (year && month && day) {
          return {
            date: `${year}-${month}-${day}`,
            hour: (hour || '00').padStart(2, '0'),
            minute: (minute || '00').padStart(2, '0'),
          };
        }
      }
    } catch {
      // Fallback ke string splitting jika Date parsing gagal
    }
  }

  // Fallback untuk string tanpa zona waktu (misal "YYYY-MM-DDTHH:mm:ss" atau "YYYY-MM-DD HH:mm:ss")
  let d = '';
  let t = '';

  if (trimmed.includes('T')) {
    const parts = trimmed.split('T');
    d = parts[0] || '';
    t = parts[1] || '';
  } else if (trimmed.includes(' ')) {
    const parts = trimmed.split(' ');
    d = parts[0] || '';
    t = parts[1] || '';
  } else if (trimmed.length === 10) {
    d = trimmed;
  }

  const [hh, mm] = (t ? t.slice(0, 5) : '00:00').split(':');
  const hour = (hh || '00').padStart(2, '0');
  const minute = (mm || '00').padStart(2, '0');

  return { date: d, hour, minute };
}

/**
 * Format tanggal dan waktu 24 jam ke representasi bahasa Indonesia yang ringkas dan elegan.
 */
function formatIndonesianDateTime(dateStr: string, hour: string, minute: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return '';
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return '';

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    const dayName = dayNames[d.getDay()];
    const monthName = monthNames[d.getMonth()];
    const timeDisplay = `${hour}:${minute} WIB`;

    return `${dayName}, ${day} ${monthName} ${year} • Pukul ${timeDisplay}`;
  } catch {
    return '';
  }
}

// Generate daftar opsi jam (00 - 23)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

// Generate daftar opsi menit (00 - 59)
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export function DateTimePicker24({
  value,
  onChange,
  label,
  helperText,
  icon,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  defaultTime = '00:00',
  className = '',
}: DateTimePicker24Props): React.JSX.Element {
  const [defaultHour, defaultMinute] = (defaultTime || '00:00').split(':');
  const { date: dateVal, hour: hourVal, minute: minuteVal } = parseDateTimeParts(value);

  const currentHour = value ? hourVal : defaultHour || '00';
  const currentMinute = value ? minuteVal : defaultMinute || '00';

  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      onChange(null);
      return;
    }
    onChange(`${newDate}T${currentHour}:${currentMinute}:00+07:00`);
  };

  const handleHourChange = (newHour: string) => {
    const activeDate = dateVal || getTodayDateStr();
    onChange(`${activeDate}T${newHour}:${currentMinute}:00+07:00`);
  };

  const handleMinuteChange = (newMinute: string) => {
    const activeDate = dateVal || getTodayDateStr();
    onChange(`${activeDate}T${currentHour}:${newMinute}:00+07:00`);
  };

  const handleClear = () => {
    onChange(null);
  };

  const formattedPreview = dateVal
    ? formatIndonesianDateTime(dateVal, currentHour, currentMinute)
    : '';

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Label & Reset Action */}
      {label && (
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 font-semibold text-neutral-200">
            {icon}
            <span>{label}</span>
            {required && <span className="text-red-400">*</span>}
          </label>
          {value && !disabled && !required && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] text-neutral-500 transition-colors hover:text-red-400"
              title="Reset waktu"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}

      {/* Baris 1: Input Tanggal — full width */}
      <input
        type="date"
        required={required}
        disabled={disabled}
        min={minDate}
        max={maxDate}
        value={dateVal}
        onChange={(e) => handleDateChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-800 bg-[#070A0F] px-3 py-2 text-xs font-medium text-white transition-colors [color-scheme:dark] focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      {/* Baris 2: Jam 24 Jam — full width, WIB badge flush-right */}
      <div className="flex w-full items-center rounded-xl border border-neutral-800 bg-[#070A0F] px-2 py-1 focus-within:border-blue-500">
        {/* Hour Select (00 - 23) */}
        <select
          disabled={disabled}
          value={currentHour}
          onChange={(e) => handleHourChange(e.target.value)}
          className="w-12 rounded-lg bg-transparent py-1 text-center font-mono text-xs font-bold text-white [color-scheme:dark] focus:bg-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          title="Pilih Jam (Format 24 Jam: 00 s/d 23)"
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h} className="bg-neutral-900 text-white">
              {h}
            </option>
          ))}
        </select>

        <span className="px-1 font-mono text-xs font-bold text-neutral-500">:</span>

        {/* Minute Select (00 - 59) */}
        <select
          disabled={disabled}
          value={currentMinute}
          onChange={(e) => handleMinuteChange(e.target.value)}
          className="w-12 rounded-lg bg-transparent py-1 text-center font-mono text-xs font-bold text-white [color-scheme:dark] focus:bg-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          title="Pilih Menit (00 s/d 59)"
        >
          {MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m} className="bg-neutral-900 text-white">
              {m}
            </option>
          ))}
        </select>

        {/* Spacer + WIB badge flush-right */}
        <div className="flex flex-1 justify-end">
          <span className="select-none rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
            WIB
          </span>
        </div>
      </div>

      {/* Live Indonesian Date & Time Preview */}
      {formattedPreview ? (
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-medium text-neutral-300">{formattedPreview}</span>
        </div>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}

function getTodayDateStr(): string {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}
