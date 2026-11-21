import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, User } from 'lucide-react';
import type { ScannerRecentCheckinItem } from '../../types';

export interface ScannerRecentLogsProps {
  logs: ScannerRecentCheckinItem[];
}

const formatWibTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
};

export function ScannerRecentLogs({ logs }: ScannerRecentLogsProps): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);

  if (logs.length === 0) return null;

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0B0E14] p-3 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-xs font-medium text-neutral-300 hover:text-white"
      >
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-neutral-400" />
          <span>Riwayat Masuk Sesi Ini ({logs.length})</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2.5 divide-y divide-neutral-900 border-t border-neutral-900 pt-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-2 text-xs">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-neutral-500" />
                  <span className="truncate font-semibold text-white">{log.buyer_name}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-neutral-400">
                  <span>{log.ticket_code}</span>
                  {log.seat_codes && log.seat_codes.length > 0 ? (
                    <span className="text-emerald-400">[{log.seat_codes.join(', ')}]</span>
                  ) : (
                    <span>({log.ticket_quantity} Pax)</span>
                  )}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-neutral-500">
                {formatWibTime(log.scanned_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
