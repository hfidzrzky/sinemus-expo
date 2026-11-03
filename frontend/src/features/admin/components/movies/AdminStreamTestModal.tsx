import React, { useState } from 'react';
import { X, Film, Key, Loader2 } from 'lucide-react';
import { CloudflareStreamPlayer } from '@/components/common';
import { useGenerateStreamPreviewTokenMutation } from '../../api';
import { toast } from 'sonner';

export interface AdminStreamTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  streamUid: string;
  signedToken?: string | null;
}

export function AdminStreamTestModal({
  isOpen,
  onClose,
  title,
  streamUid,
  signedToken: initialSignedToken,
}: AdminStreamTestModalProps): React.JSX.Element | null {
  const [signedToken, setSignedToken] = useState<string | null>(initialSignedToken || null);
  const tokenMutation = useGenerateStreamPreviewTokenMutation();

  if (!isOpen) return null;

  const handleGenerateToken = async () => {
    try {
      const res = await tokenMutation.mutateAsync(streamUid);
      setSignedToken(res.signed_token);
      toast.success('Signed Token RS256 1 Jam berhasil diterbitkan.');
    } catch {
      toast.error(
        'Gagal menerbitkan token. Pastikan Cloudflare Key ID dan PEM Key terkonfigurasi.'
      );
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-800 bg-[#0B0E14] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300">
              <Film className="h-4 w-4" />
            </div>
            <div>
              <h3 className="line-clamp-1 font-display text-sm font-bold text-white">
                Uji Putar Stream: {title || 'Film Sinemus'}
              </h3>
              <p className="font-mono text-[10px] text-neutral-400">
                Cloudflare UID: <span className="text-blue-400">{streamUid}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!signedToken && (
              <button
                type="button"
                onClick={handleGenerateToken}
                disabled={tokenMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white disabled:opacity-50"
                title="Gunakan Signed Token jika video memiliki Require Signed URLs aktif"
              >
                {tokenMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Key className="h-3 w-3 text-amber-400" />
                )}
                <span>{tokenMutation.isPending ? 'Menerbitkan...' : 'Gunakan Signed Token'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Player Canvas */}
        <div className="relative w-full bg-black">
          <CloudflareStreamPlayer
            videoUid={streamUid}
            signedToken={signedToken}
            title={title}
            autoplay={false}
            controls={true}
            isPrivate={Boolean(signedToken)}
          />
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between bg-[#0D111A] px-5 py-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Pemutaran dialirkan aman via Cloudflare Stream CDN.</span>
            {signedToken && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                <Key className="h-2.5 w-2.5" />
                Mode Signed Aktif
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-neutral-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-neutral-700"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
}
