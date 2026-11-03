import React from 'react';
import { CloudflareImageUpload } from '../common';
import type { CreateMoviePayload } from '../../types';

export interface MovieTabMediaAssetsProps {
  formData: CreateMoviePayload;
  onChange: (updates: Partial<CreateMoviePayload>) => void;
}

export function MovieTabMediaAssets({
  formData,
  onChange,
}: MovieTabMediaAssetsProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold text-white">Aset Visual Sinematik</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Unggah gambar poster portrait resmi (2:3) dan backdrop landscape (16:9) melalui Cloudflare
          Images dengan optimasi AVIF/WebP otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Poster Portrait (2:3) */}
        <CloudflareImageUpload
          label="Poster Portrait Film (2:3)"
          aspectRatio="2:3"
          required
          value={formData.poster_url || null}
          onChange={(url) => onChange({ poster_url: url || '' })}
          recommendedDimensions="600 × 900 px"
          assetType="movie_poster"
          helperText="Ditampilkan pada katalog kartu film beranda, pencarian, dan cover share media sosial."
        />

        {/* Backdrop Landscape (16:9) */}
        <CloudflareImageUpload
          label="Backdrop Landscape Film (16:9)"
          aspectRatio="16:9"
          required
          value={formData.backdrop_url || null}
          onChange={(url) => onChange({ backdrop_url: url || '' })}
          recommendedDimensions="1920 × 1080 px"
          assetType="movie_backdrop"
          helperText="Ditampilkan sebagai latar belakang cinematic header halaman nonton dan Hero Carousel."
        />
      </div>
    </div>
  );
}
