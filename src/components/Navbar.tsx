'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Camera, 
  LayoutDashboard, 
  Boxes, 
  ArrowRightLeft, 
  ClipboardCheck, 
  Users, 
  QrCode, 
  Bell, 
  ChevronDown, 
  RotateCcw,
  Smartphone
} from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';
import { InstallAppModal } from './InstallAppModal';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, 
    setCurrentUser, 
    profiles, 
    assets, 
    pendingTransfersCount, 
    unreadNotificationsCount,
    googleSheetsStatus,
    googleSheetsError,
    googleSheetUrl,
    isSyncing,
    syncWithGoogleSheets,
    requestPushPermission,
    sendTestNotification,
    resetToDemoData 
  } = useApp();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/assets', label: 'Thiết Bị', icon: Boxes },
    { 
      href: '/transfers', 
      label: 'Mượn – Trả', 
      icon: ArrowRightLeft,
      badge: pendingTransfersCount > 0 ? pendingTransfersCount : null 
    },
    { href: '/audit', label: 'Kiểm Kê', icon: ClipboardCheck },
    { href: '/staff', label: 'Nhân Sự', icon: Users },
  ];

  const handleScanSuccess = (code: string) => {
    setIsScannerOpen(false);
    router.push(`/assets/${code}`);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-2.5 sm:py-3 no-print shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Studio Brand */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1 font-mono">
                MẮT MỘT MÍ <span className="text-orange-600">MEDIA</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium tracking-wide hidden sm:block">
                Quản lý thiết bị máy ảnh cưới thông minh
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Google Sheets Sync Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium bg-slate-50 border-slate-200">
              <span className={`w-2 h-2 rounded-full ${
                googleSheetsStatus === 'connected' ? 'bg-emerald-500' :
                googleSheetsStatus === 'loading' ? 'bg-amber-500 animate-pulse' :
                'bg-rose-500'
              }`} />
              <span className="text-[11px] font-bold text-slate-700">
                {googleSheetsStatus === 'connected' ? 'Sheets' :
                 googleSheetsStatus === 'loading' ? 'Kết nối...' : 'Chưa lưu Sheets'}
              </span>
              <button
                onClick={() => syncWithGoogleSheets()}
                disabled={isSyncing}
                title="Đồng bộ lại dữ liệu với Google Sheets"
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition"
              >
                <RotateCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>

            {/* Install App on Phone button */}
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
              title="Cài app vào iPhone hoặc Android"
            >
              <Smartphone className="w-4 h-4 text-orange-600" />
              <span>Cài App</span>
            </button>

            {/* Quick Scan QR Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-orange-600/25 transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Quét QR</span>
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition"
              title="Thông báo mượn trả & quá hạn"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Role & User Switcher for Testing/Demo */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser?.full_name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-orange-500/50"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                    {currentUser?.full_name.split(' (')[0]}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                      currentUser?.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                      currentUser?.role === 'manager' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'manager' ? 'Quản lý' : 'Nhân sự'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Chọn vai trò trải nghiệm
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Chuyển đổi giữa Admin, Quản lý và Nhân sự
                    </p>
                  </div>

                  <div className="py-1 space-y-1 max-h-60 overflow-y-auto">
                    {profiles.map(p => {
                      const isCurrent = currentUser?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setCurrentUser(p);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs flex items-center gap-2.5 transition ${
                            isCurrent
                              ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={p.full_name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div className="flex-1 truncate">
                            <div className="truncate font-semibold">{p.full_name}</div>
                            <div className="text-[10px] text-slate-400">
                              {p.status === 'locked' ? (
                                <span className="text-rose-600 font-bold">(Đã khóa)</span>
                              ) : (
                                p.email
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            p.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                            p.role === 'manager' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {p.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsInstallModalOpen(true);
                      }}
                      className="w-full py-1.5 px-2 text-slate-700 hover:bg-slate-100 rounded-xl text-[11px] font-bold flex items-center gap-2 transition"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                      <span>Cài đặt App vào điện thoại</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Làm sạch toàn bộ dữ liệu trên máy để bắt đầu nhập mới từ đầu?')) {
                          resetToDemoData();
                          setIsUserMenuOpen(false);
                          window.location.reload();
                        }
                      }}
                      className="w-full py-1.5 px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl text-[11px] flex items-center gap-2 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                      <span>Xóa dữ liệu cũ (Bắt đầu thêm mới)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Push & Chime Activation Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-3.5 py-1.5 text-xs flex items-center justify-between gap-2 shadow-sm no-print sm:hidden">
        <div className="flex items-center gap-1.5 truncate">
          <Bell className="w-3.5 h-3.5 shrink-0 animate-bounce" />
          <span className="truncate text-[11px] font-medium">
            Thông báo chuông & rung khi có mượn trả
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={async () => {
              await requestPushPermission();
              sendTestNotification();
            }}
            className="px-2.5 py-1 bg-white text-orange-700 hover:bg-orange-50 font-bold rounded-lg text-[10px] shadow-sm transition active:scale-95"
          >
            Thử chuông & rung
          </button>
        </div>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex items-center justify-around no-print shadow-lg">
        {navLinks.map(link => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
                isActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {link.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {link.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5">{link.label}</span>
            </Link>
          );
        })}

        {/* Center Prominent Scan Button */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex flex-col items-center py-1 px-2 text-orange-600 hover:text-orange-700"
        >
          <div className="w-10 h-10 -mt-5 rounded-full bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/40">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-slate-800">Quét QR</span>
        </button>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        assets={assets}
      />

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />
    </>
  );
};
