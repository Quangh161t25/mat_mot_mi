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
  ShieldCheck, 
  UserCheck, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, 
    setCurrentUser, 
    profiles, 
    assets, 
    pendingTransfersCount, 
    overdueAssetsCount,
    resetToDemoData 
  } = useApp();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
      <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Studio Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-wider text-white flex items-center gap-1.5 font-mono">
                MẮT MỘT MÍ <span className="text-orange-500">MEDIA</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                Hệ thống Quản lý Thiết bị & Máy ảnh cưới
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
          <div className="flex items-center gap-2.5">
            {/* Quick Scan QR Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Quét QR</span>
            </button>

            {/* Notification Indicators */}
            <Link
              href="/transfers"
              className="relative p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
              title="Thông báo chờ xác nhận / quá hạn"
            >
              <Bell className="w-4 h-4" />
              {(pendingTransfersCount > 0 || overdueAssetsCount > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0B0F17]">
                  {pendingTransfersCount + overdueAssetsCount}
                </span>
              )}
            </Link>

            {/* Role & User Switcher for Testing/Demo */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser?.full_name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-orange-500/50"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                    {currentUser?.full_name.split(' (')[0]}
                    {currentUser?.role === 'admin' && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1 py-0.2 rounded font-mono">Admin</span>
                    )}
                    {currentUser?.role === 'manager' && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-mono">Quản lý</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Đổi vai trò
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#131B2E] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
                  <div className="p-2 border-b border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Chuyển đổi tài khoản (Demo)
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Thử nghiệm phân quyền Admin, Quản lý và Nhân sự
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
                              ? 'bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40'
                              : 'text-slate-300 hover:bg-slate-800/80'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={p.full_name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div className="flex-1 truncate">
                            <div className="truncate font-medium">{p.full_name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span>{p.email}</span>
                              {p.status === 'locked' && (
                                <span className="text-rose-400 font-bold">(Đã khóa)</span>
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            p.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                            p.role === 'manager' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {p.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        if (confirm('Khôi phục dữ liệu mẫu ban đầu của Mắt Một Mí Media?')) {
                          resetToDemoData();
                          setIsUserMenuOpen(false);
                        }
                      }}
                      className="w-full py-1.5 px-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl text-[11px] flex items-center gap-2 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                      <span>Đặt lại dữ liệu mẫu Studio</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around no-print">
        {navLinks.map(link => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
                isActive ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
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

        {/* Floating Scan button in center */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="flex flex-col items-center py-1 px-2.5 text-orange-400 hover:text-orange-300"
        >
          <div className="w-9 h-9 -mt-4 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/40">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-white">Quét QR</span>
        </button>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        assets={assets}
      />
    </>
  );
};
