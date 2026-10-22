'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, Check, ArrowRight } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed as standalone PWA
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(Boolean(standalone));

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIPhoneOrIPad);

    // Capture Android beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) {
      alert('Để cài đặt trên Android: Mở menu 3 chấm (⋮) ở góc trên bên phải trình duyệt Chrome và chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cài Đặt App Vào Điện Thoại</h3>
              <p className="text-xs text-slate-500">Dùng mượt mà như app tải từ App Store / CH Play</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* App preview card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt="Mắt Một Mí Media"
              className="w-14 h-14 rounded-2xl object-cover shadow-md ring-2 ring-orange-500/30"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Mắt Một Mí Media</h4>
              <p className="text-xs text-slate-500">Quản lý toàn bộ thiết bị máy ảnh cưới</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  iPhone & Android
                </span>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Chuông báo tức thì
                </span>
              </div>
            </div>
          </div>

          {isStandalone ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
              <Check className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-bold text-emerald-800">
                Ứng dụng đã được cài đặt trên điện thoại của bạn!
              </div>
              <p className="text-xs text-emerald-700">
                Bạn đang chạy Mắt Một Mí Media ở chế độ App toàn màn hình.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab Guide for iOS vs Android */}
              {isIOS ? (
                /* HƯỚNG DẪN DÀNH CHO IPHONE (iOS) */
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 text-slate-800">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <span>📱 Hướng dẫn tạo App trên iPhone (Safari):</span>
                    </div>

                    <div className="space-y-2 text-slate-700">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                        <span>Mở trang này bằng trình duyệt <strong>Safari</strong> trên iPhone. Bấm nút <strong>Chia sẻ</strong> (biểu tượng hình vuông có mũi tên chỉ lên <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> ở thanh dưới màn hình).</span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                        <span>Cuộn xuống trong menu và chọn <strong>&quot;Thêm vào Màn hình chính&quot;</strong> (Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-slate-800 mx-0.5" />).</span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                        <span>Bấm nút <strong>&quot;Thêm&quot;</strong> (Add) ở góc trên cùng bên phải.</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 text-center italic">
                    Sau khi thêm, icon Mắt Một Mí sẽ xuất hiện trên màn hình chính như ứng dụng từ App Store, mở nhanh và nhận thông báo khi có mượn trả!
                  </p>
                </div>
              ) : (
                /* HƯỚNG DẪN DÀNH CHO ANDROID (CHROME) */
                <div className="space-y-3">
                  <button
                    onClick={handleInstallAndroid}
                    className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 text-sm transition active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    <span>Cài Đặt App Ngay (1 Chạm)</span>
                  </button>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-800 block">Nếu không thấy hộp thoại cài đặt:</span>
                    <span>Bấm vào menu <strong>3 chấm (⋮)</strong> góc trên bên phải trình duyệt Chrome ➔ Chọn <strong>&quot;Cài đặt ứng dụng&quot;</strong> hoặc <strong>&quot;Thêm vào màn hình chính&quot;</strong>.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Close Button */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
