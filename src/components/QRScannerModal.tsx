'use client';

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, Upload, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Asset } from '@/types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (assetCode: string) => void;
  assets?: Asset[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  assets = [],
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập camera trực tiếp.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: unknown) {
      console.warn('Không thể mở camera:', err);
      const errorMsg = err instanceof Error ? err.message : 'Không thể kết nối máy ảnh';
      setCameraError(
        'Không thể mở camera (có thể do quyền truy cập hoặc thiết bị không có camera). Bạn có thể tải ảnh chụp QR lên hoặc chọn mã thiết bị bên dưới.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Frame processing loop
  useEffect(() => {
    if (!isScanning) return;

    const scanFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
              handleDetectedCode(code.data);
              return; // Stop scan loop
            }
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning]);

  const handleDetectedCode = (rawData: string) => {
    // If QR contains full URL (e.g. https://.../assets/MMM-CAM-001 or /assets/MMM-CAM-001)
    let extracted = rawData.trim();
    if (extracted.includes('/assets/')) {
      const parts = extracted.split('/assets/');
      extracted = parts[parts.length - 1].split('?')[0].split('#')[0];
    }

    stopCamera();
    onScanSuccess(extracted);
    onClose();
  };

  // Upload/snapshot image file fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleDetectedCode(code.data);
          } else {
            alert('Không tìm thấy mã QR hợp lệ trong ảnh này. Hãy thử lại hoặc nhập mã thiết bị!');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Quét Mã QR Thiết Bị</h3>
              <p className="text-xs text-slate-400">Hướng camera vào tem dán trên thiết bị</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Scanner Area */}
        <div className="relative aspect-square bg-black overflow-hidden flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-xs text-slate-300 mb-4">{cameraError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition"
              >
                <Upload className="w-4 h-4 text-orange-400" />
                Chọn ảnh chụp tem QR
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-64 h-64 border-2 border-orange-500/80 rounded-2xl shadow-inner shadow-orange-500/20">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
                  
                  {/* Laser Scan line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Action Controls & Manual Fallback */}
        <div className="p-4 space-y-3 bg-[#0E1524]">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700/60"
            >
              <Upload className="w-4 h-4 text-orange-400" />
              Tải ảnh QR lên
            </button>
            <button
              onClick={startCamera}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700/60"
              title="Khởi động lại camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Manual Code Search */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hoặc nhập mã (vd: MMM-CAM-001)"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Mở
            </button>
          </form>

          {/* Quick Asset Selector */}
          {assets.length > 0 && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Chọn nhanh thiết bị có sẵn để mở:
              </label>
              <select
                onChange={e => {
                  if (e.target.value) handleDetectedCode(e.target.value);
                }}
                defaultValue=""
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="" disabled>-- Chọn thiết bị trong studio --</option>
                {assets.map(a => (
                  <option key={a.id} value={a.code}>
                    {a.code} - {a.name} ({a.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
