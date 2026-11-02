'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Camera, Lock, Eye, EyeOff, LogIn, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, canDismiss = false }) => {
  const { login, profiles } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = login(identifier, password);
    setIsSubmitting(false);

    if (res.success) {
      if (onClose) onClose();
    } else {
      setError(res.error || 'Đăng nhập không thành công');
    }
  };

  const handleQuickLogin = (pIdentifier: string, pPass: string) => {
    setError(null);
    setIdentifier(pIdentifier);
    setPassword(pPass);
    const res = login(pIdentifier, pPass);
    if (res.success && onClose) {
      onClose();
    } else if (!res.success) {
      setError(res.error || 'Lỗi đăng nhập nhanh');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-br from-orange-600 to-amber-600 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight font-mono">MẮT MỘT MÍ MEDIA</h2>
              <p className="text-xs text-orange-100 font-medium">Đăng nhập hệ thống quản lý thiết bị</p>
            </div>
          </div>
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              ✕
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Tài khoản (Tên, Email hoặc Số điện thoại)
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="VD: Nguyễn Hùng, Minh, hoặc Duy"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                <span>Mật khẩu</span>
                <span className="text-[11px] text-slate-400 font-normal">Mặc định: 123456 (hoặc admin)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>
          </form>

          {/* Quick Demo Login Pills */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Đăng nhập nhanh 1-Click để test phân quyền:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Nguyễn Hùng (Admin)', 'admin')}
                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-left transition text-xs group"
              >
                <div className="font-bold text-rose-900 truncate">Hùng (Admin)</div>
                <div className="text-[10px] text-rose-600">Pass: admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Minh', '123456')}
                className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition text-xs group"
              >
                <div className="font-bold text-blue-900 truncate">Minh (Nhân sự)</div>
                <div className="text-[10px] text-blue-600">Pass: 123456</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('Duy', '123456')}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition text-xs group"
              >
                <div className="font-bold text-emerald-900 truncate">Duy (Nhân sự)</div>
                <div className="text-[10px] text-emerald-600">Pass: 123456</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
