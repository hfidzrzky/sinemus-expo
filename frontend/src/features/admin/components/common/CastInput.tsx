import React, { useState, useRef, useMemo, KeyboardEvent } from 'react';
import { Plus, X, Users, User } from 'lucide-react';
import type { CastMember, CastItem } from '../../types';

export interface CastInputProps {
  value?: CastItem[];
  onChange: (cast: CastMember[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Normalisasi item cast dari format legacy string maupun objek terstruktur.
 */
function normalizeItem(item: CastItem): CastMember {
  if (typeof item === 'string') {
    return { actor: item.trim(), role: null };
  }
  if (item && typeof item === 'object') {
    const rawActor = item.actor || (item as unknown as { name?: string }).name || '';
    const rawRole = item.role ?? (item as unknown as { character?: string }).character ?? null;
    return {
      actor: String(rawActor).trim(),
      role: rawRole ? String(rawRole).trim() : null,
    };
  }
  return { actor: '', role: null };
}

export const CastInput: React.FC<CastInputProps> = ({
  value = [],
  onChange,
  disabled = false,
  className = '',
}) => {
  const [actorInput, setActorInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const actorInputRef = useRef<HTMLInputElement>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    return (value || []).map(normalizeItem).filter((item) => item.actor.length > 0);
  }, [value]);

  const handleAdd = () => {
    if (disabled) return;
    const actorTrimmed = actorInput.trim();
    if (!actorTrimmed) {
      actorInputRef.current?.focus();
      return;
    }

    const roleTrimmed = roleInput.trim();
    const newMember: CastMember = {
      actor: actorTrimmed,
      role: roleTrimmed ? roleTrimmed : null,
    };

    // Cegah duplikasi persis sama
    const isDuplicate = items.some(
      (it) =>
        it.actor.toLowerCase() === newMember.actor.toLowerCase() &&
        (it.role || '').toLowerCase() === (newMember.role || '').toLowerCase()
    );

    if (!isDuplicate) {
      onChange([...items, newMember]);
    }

    setActorInput('');
    setRoleInput('');
    actorInputRef.current?.focus();
  };

  const handleRemove = (indexToRemove: number) => {
    if (disabled) return;
    onChange(items.filter((_, idx) => idx !== indexToRemove));
  };

  const handleActorKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      // Jika peran masih kosong, arahkan kursor ke input peran agar admin bisa mengisinya
      if (!roleInput.trim()) {
        roleInputRef.current?.focus();
      } else {
        handleAdd();
      }
    }
  };

  const handleRoleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Group: Dua kolom side-by-side (Aktor & Peran) + Tombol Tambah */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Input Nama Aktor / Cast */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
            <User className="h-3.5 w-3.5" />
          </div>
          <input
            ref={actorInputRef}
            type="text"
            disabled={disabled}
            value={actorInput}
            onChange={(e) => setActorInput(e.target.value)}
            onKeyDown={handleActorKeyDown}
            placeholder="Nama Aktor / Cast (cth: Reza Rahadian)"
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Input Karakter / Peran */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
            <Users className="h-3.5 w-3.5" />
          </div>
          <input
            ref={roleInputRef}
            type="text"
            disabled={disabled}
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            onKeyDown={handleRoleKeyDown}
            placeholder="Karakter / Peran (cth: B.J. Habibie) — Opsional"
            className="w-full rounded-xl border border-neutral-800 bg-[#0D111A] py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Tombol Tambah */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !actorInput.trim()}
          className="inline-flex h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Helper text petunjuk penggunaan */}
      <p className="text-[11px] text-neutral-500">
        Ketik nama aktor, tekan{' '}
        <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 font-mono text-[10px] text-neutral-300">
          Enter
        </kbd>{' '}
        atau pindah ke kolom peran/karakter (opsional), lalu tekan Enter kembali untuk menambahkan
        ke daftar.
      </p>

      {/* Daftar Cast & Pemeran yang sudah ditambahkan */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item, idx) => (
            <div
              key={`${item.actor}-${idx}`}
              className="group flex items-center justify-between gap-2.5 rounded-xl border border-neutral-800/80 bg-[#0D111A] px-3.5 py-2.5 text-xs transition-colors hover:border-neutral-700"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-800 text-[10px] font-bold text-neutral-300">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-200">{item.actor}</p>
                  {item.role && (
                    <p className="truncate text-[11px] text-neutral-400">
                      sebagai <span className="font-medium text-blue-400">{item.role}</span>
                    </p>
                  )}
                </div>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-red-400"
                  title="Hapus dari daftar"
                  aria-label={`Hapus ${item.actor}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-[#0D111A]/40 px-4 py-3 text-center text-xs text-neutral-500">
          Belum ada cast & pemeran yang ditambahkan. Masukkan nama aktor dan perannya di atas.
        </div>
      )}
    </div>
  );
};
