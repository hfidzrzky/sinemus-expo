import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';

export interface UseCameraScannerOptions {
  viewportElementId: string;
  onScan: (decodedText: string) => void | Promise<void>;
  cooldownMs?: number; // default 2500ms anti-spam
}

export interface UseCameraScannerReturn {
  isScanning: boolean;
  isCooldown: boolean;
  cameraError: string | null;
  availableCameras: CameraDevice[];
  activeCameraId: string | null;
  isTorchOn: boolean;
  hasTorch: boolean;
  startScanner: () => Promise<void>;
  stopScanner: () => Promise<void>;
  switchCamera: () => Promise<void>;
  toggleTorch: () => Promise<void>;
  playBeep: (type: 'success' | 'duplicate' | 'error') => void;
}

// Filter out virtual camera software (OBS Virtual Camera, DroidCam, etc.)
const isVirtualCamera = (label: string): boolean => {
  return /obs|virtual|screen|droidcam|iriun|vysor|fake|manycam|splitcam|xsplit|software/i.test(
    label
  );
};

export function useCameraScanner({
  viewportElementId,
  onScan,
  cooldownMs = 2500,
}: UseCameraScannerOptions): UseCameraScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef(false);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Web Audio Context synthesizer for audio feedback without external audio assets
  const playBeep = useCallback((type: 'success' | 'duplicate' | 'error') => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'success') {
        // High upbeat double beep (880Hz -> 1320Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(80);
        }
      } else if (type === 'duplicate') {
        // Warning buzz (300Hz saw-tooth double pulse)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(280, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);

        if ('vibrate' in navigator) {
          navigator.vibrate([150, 80, 250]);
        }
      } else {
        // Low error buzz (180Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);

        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    } catch {
      // Audio playback silently suppressed if blocked by autoplay policy
    }
  }, []);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      if (isCooldownRef.current) {
        return;
      }

      isCooldownRef.current = true;
      setIsCooldown(true);

      try {
        void onScanRef.current(decodedText.trim());
      } finally {
        setTimeout(() => {
          isCooldownRef.current = false;
          setIsCooldown(false);
        }, cooldownMs);
      }
    },
    [cooldownMs]
  );

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore stop error on unmount
      }
    }
    setIsScanning(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        setCameraError('Tidak ditemukan perangkat kamera di perangkat ini.');
        return;
      }

      // Filter out virtual/third-party software cameras (e.g. OBS Virtual Camera)
      const physicalDevices = devices.filter((d) => !isVirtualCamera(d.label));
      const usableDevices = physicalDevices.length > 0 ? physicalDevices : devices;
      setAvailableCameras(usableDevices);

      // Prioritize: 1) Back camera (mobile), 2) Built-in webcam (desktop/laptop), 3) First physical camera
      const preferredCamera =
        usableDevices.find((d) => /back|rear|environment/i.test(d.label)) ||
        usableDevices.find((d) =>
          /integrated|webcam|front|user|facetime|built-in/i.test(d.label)
        ) ||
        usableDevices[0];

      const isValidActiveId = activeCameraId && usableDevices.some((d) => d.id === activeCameraId);
      const selectedId = isValidActiveId ? activeCameraId : preferredCamera.id;
      setActiveCameraId(selectedId);

      // Create new instance if needed
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(viewportElementId);
      }

      // If already scanning, stop first
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        selectedId,
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        handleScanSuccess,
        () => {
          // Frame scan error / no QR in frame: no-op
        }
      );

      setIsScanning(true);

      // Check torch capability
      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities() as {
          torch?: boolean;
        };
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Izin akses kamera ditolak.';
      setCameraError(msg);
      setIsScanning(false);
    }
  }, [activeCameraId, viewportElementId, handleScanSuccess]);

  const switchCamera = useCallback(async () => {
    if (availableCameras.length <= 1) return;

    const currentIndex = availableCameras.findIndex((c) => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];

    setActiveCameraId(nextCamera.id);

    if (isScanning && scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.start(
          nextCamera.id,
          {
            fps: 12,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          handleScanSuccess,
          () => {}
        );
      } catch (err) {
        setCameraError(err instanceof Error ? err.message : 'Gagal beralih kamera.');
      }
    }
  }, [availableCameras, activeCameraId, isScanning, handleScanSuccess]);

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !hasTorch) return;

    try {
      const nextTorch = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as unknown as MediaTrackConstraintSet],
      });
      setIsTorchOn(nextTorch);
    } catch {
      // Torch not supported on some platforms
    }
  }, [hasTorch, isTorchOn]);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        void scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, []);

  return {
    isScanning,
    isCooldown,
    cameraError,
    availableCameras,
    activeCameraId,
    isTorchOn,
    hasTorch,
    startScanner,
    stopScanner,
    switchCamera,
    toggleTorch,
    playBeep,
  };
}
