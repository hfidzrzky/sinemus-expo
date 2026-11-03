import React, { useState } from 'react';
import { Image as ImageIcon, Film, ImagePlus } from 'lucide-react';
import { CloudflareImageUpload } from '../common';

export interface AdminMediaUploadCardProps {
  posterUrl: string | null;
  backdropUrl: string | null;
  onPosterChange: (url: string | null) => void;
  onBackdropChange: (url: string | null) => void;
  assetTypePrefix?: string;
  className?: string;
}

export function AdminMediaUploadCard({
  posterUrl,
  backdropUrl,
  onPosterChange,
  onBackdropChange,
  assetTypePrefix = 'event',
  className = '',
}: AdminMediaUploadCardProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'backdrop' | 'poster'>('backdrop');

  return (
    <div
      className={`rounded-2xl border border-neutral-800 bg-[#0B0E14] p-4 shadow-lg transition-all sm:p-5 ${className}`}
    >
      {/* Header Card */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-[#0F1420] text-blue-400">
            <ImageIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Aset Visual & Media</h4>
            <p className="text-[10px] text-neutral-400">Cloudflare Images Direct CDN</p>
          </div>
        </div>
      </div>

      {/* Segmented Switcher Tab - Sinkron 100% dengan Live Preview Penonton */}
      <div className="mt-3.5 grid grid-cols-2 gap-1 rounded-xl border border-neutral-800 bg-[#0D111A] p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('backdrop')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
            activeTab === 'backdrop'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Film className="h-3.5 w-3.5" />
          <span>Banner (16:9)</span>
          {backdropUrl && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Telah Diunggah" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('poster')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
            activeTab === 'poster'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          <span>Poster (2:3)</span>
          {posterUrl && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Telah Diunggah" />
          )}
        </button>
      </div>

      {/* Upload Zone Area — Isolated Instances per Aspect Ratio to Prevent Cross-Tab State Leaks */}
      <div className="mt-4">
        <div className={activeTab === 'backdrop' ? 'block' : 'hidden'}>
          <CloudflareImageUpload
            key={`uploader-${assetTypePrefix}-backdrop`}
            label="Banner Landscape Resmi (16:9)"
            aspectRatio="16:9"
            required
            value={backdropUrl}
            onChange={onBackdropChange}
            recommendedDimensions="1920 × 1080 px"
            assetType={`${assetTypePrefix}_backdrop`}
            helperText="Visual latar resolusi tinggi untuk backdrop halaman dan banner beranda."
          />
        </div>

        <div className={activeTab === 'poster' ? 'block' : 'hidden'}>
          <CloudflareImageUpload
            key={`uploader-${assetTypePrefix}-poster`}
            label="Poster Portrait Resmi (2:3)"
            aspectRatio="2:3"
            required
            value={posterUrl}
            onChange={onPosterChange}
            recommendedDimensions="600 × 900 px"
            assetType={`${assetTypePrefix}_poster`}
            helperText="Dioptimasi ke WebP/AVIF untuk kartu feed dan e-tiket penonton."
          />
        </div>
      </div>
    </div>
  );
}
