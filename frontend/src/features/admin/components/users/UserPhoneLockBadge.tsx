import React from 'react';
import { Lock, Unlock } from 'lucide-react';

export interface UserPhoneLockBadgeProps {
  isLocked: boolean;
  phoneNumber?: string | null;
}

export function UserPhoneLockBadge({
  isLocked,
  phoneNumber,
}: UserPhoneLockBadgeProps): React.JSX.Element {
  if (isLocked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
        <Lock className="h-3 w-3" />
        <span>Terkunci</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
      <Unlock className="h-3 w-3 text-amber-400" />
      <span>{phoneNumber ? 'Belum Terkunci' : 'Belum Terisi'}</span>
    </span>
  );
}
