import React from 'react';
import { CloudflareStreamInput } from '../common';
import type { CreateMoviePayload } from '../../types';

export interface MovieTabStreamConfigProps {
  formData: CreateMoviePayload;
  onChange: (updates: Partial<CreateMoviePayload>) => void;
  onOpenTestModal: (uid: string, title?: string) => void;
}

export function MovieTabStreamConfig({
  formData,
  onChange,
  onOpenTestModal,
}: MovieTabStreamConfigProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold text-white">
          Konfigurasi Video & Streaming HLS
        </h3>
        <p className="mt-1 text-xs text-neutral-400">
          Sinkronisasi video full movie dan trailer yang dilindungi token JWT terenkripsi
          anti-bajakan.
        </p>
      </div>

      <div className="space-y-5">
        {/* Full Movie Stream UID (Required) */}
        <CloudflareStreamInput
          label="Cloudflare Stream Video UID (Full Movie)"
          required
          value={formData.cloudflare_video_uid || null}
          onChange={(val) => onChange({ cloudflare_video_uid: val || '' })}
          placeholder="Contoh: c0a9482bf1092a884fbc990182bcf01a"
          helperText="Video master 1080p terenkripsi dialirkan via protokol HLS (.m3u8) dengan Signed Playback Token."
          savedDurationMinutes={formData.duration_minutes}
          onOpenPreview={(uid) => onOpenTestModal(uid, `${formData.title || 'Film'} (Full Movie)`)}
        />

        {/* Trailer UID (Optional) */}
        <CloudflareStreamInput
          label="Cloudflare Stream Trailer UID"
          optional
          value={formData.cloudflare_trailer_uid || null}
          onChange={(val) => onChange({ cloudflare_trailer_uid: val })}
          placeholder="Contoh: 884bf92a019eebc829910bfcd9281a99"
          helperText="Video trailer publik untuk preview gratis calon penonton sebelum menyewa film."
          onOpenPreview={(uid) => onOpenTestModal(uid, `${formData.title || 'Film'} (Trailer)`)}
        />
      </div>
    </div>
  );
}
