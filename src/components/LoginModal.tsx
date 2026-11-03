'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Camera, Lock, Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, canDismiss = false }) => {
  const { login } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await login(identifier, password);
    setIsSubmitting(false);

    if (res.success) {
      setPassword('');
      if (onClose) onClose();
    } else {
      setError(res.error || 'Đăng nhập không thành công');
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


        </div>
      </div>
    </div>
  );
};
