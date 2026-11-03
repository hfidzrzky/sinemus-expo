import React from 'react';

export interface VoucherQuotaProgressProps {
  usedQuota: number;
  totalQuota: number;
  showLabel?: boolean;
}

export function VoucherQuotaProgress({
  usedQuota,
  totalQuota,
  showLabel = true,
}: VoucherQuotaProgressProps): React.JSX.Element {
  const safeTotal = Math.max(1, totalQuota);
  const percentage = Math.min(100, Math.round((usedQuota / safeTotal) * 100));
  const isFull = usedQuota >= totalQuota;

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-400';

  if (isFull) {
    barColor = 'bg-rose-500';
    textColor = 'text-rose-400';
  } else if (percentage >= 80) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
  }

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">
            {usedQuota} / {totalQuota} Kuota
          </span>
          <span className={`font-mono font-bold ${textColor}`}>
            {isFull ? 'Habis' : `${percentage}%`}
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
