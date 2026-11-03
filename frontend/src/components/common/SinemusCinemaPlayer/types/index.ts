export interface ResolutionTrack {
  id: number;
  height: number;
  width: number;
  bandwidth: number;
  label: string;
  active: boolean;
}

export interface SeekFeedbackState {
  direction: 'backward' | 'forward';
  seconds: number;
  key: number;
}

export interface SinemusCinemaPlayerProps {
  /** Manifest URL HLS (.m3u8) langsung dari Cloudflare Stream */
  manifestUrl?: string | null;
  /** Cloudflare Stream Video UID */
  videoUid?: string | null;
  /** RS256 Signed JWT Token jika video berbayar / privat */
  signedToken?: string | null;
  /** Judul film untuk header di pojok kiri atas */
  title: string;
  /** Putar otomatis saat player siap */
  autoplay?: boolean;
  /** Callback saat tombol back di pojok kiri atas diklik */
  onBack?: () => void;
  /** Callback saat terjadi galat pemutaran */
  onError?: (error: Error) => void;
  /** Class CSS styling tambahan untuk container */
  className?: string;
  /** Apakah konten merupakan film penuh berbayar */
  isVoD?: boolean;
  /** Watermark teks anti-piracy di pojok kanan bawah */
  watermarkText?: string;
  /** Elemen badge di pojok kanan atas (misal countdown sewa) */
  topRightBadge?: React.ReactNode;
}
