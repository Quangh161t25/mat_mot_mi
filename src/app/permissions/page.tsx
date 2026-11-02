'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  UserProfile, 
  UserPermissions, 
  CrudPermissions, 
  getUserPermissions, 
  DEFAULT_PERMISSIONS_BY_ROLE 
} from '@/types';
import { 
  ShieldCheck, 
  Search, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  Eye, 
  Plus, 
  Pencil, 
  Trash2, 
  Boxes, 
  ArrowRightLeft, 
  Users, 
  ClipboardCheck, 
  History, 
  Clock,
  Sparkles,
  RotateCcw,
  Sliders
} from 'lucide-react';

export default function PermissionsPage() {
  const { 
    profiles, 
    currentUser, 
    isAdmin, 
    canManageUsers, 
    updateUserPermissions,
    syncWithGoogleSheets,
    isSyncing 
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Modal editing permissions state
  const [editingPermissions, setEditingPermissions] = useState<UserPermissions>(
    DEFAULT_PERMISSIONS_BY_ROLE.staff
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenConfig = (profile: UserProfile) => {
    setSelectedProfile(profile);
    setEditingPermissions(getUserPermissions(profile));
    setSavedSuccess(false);
    setIsConfigModalOpen(true);
  };

  const handleApplyPreset = (presetKey: 'admin' | 'manager' | 'staff' | 'readonly') => {
    if (presetKey === 'readonly') {
      setEditingPermissions({
        assets: { view: true, create: false, edit: false, delete: false },
        transfers: { view: true, create: false, edit: false, delete: false },
        staff: { view: true, create: false, edit: false, delete: false },
        audit: { view: true, create: false, edit: false, delete: false },
        logs: { view: true },
        attendance: { view: true, create: false, edit: false, delete: false },
      });
    } else {
      setEditingPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_BY_ROLE[presetKey])));
    }
  };

  const handleToggleCrud = (
    module: 'assets' | 'transfers' | 'staff' | 'audit' | 'attendance', 
    field: keyof CrudPermissions
  ) => {
    setEditingPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || { view: true, create: true, edit: false, delete: false }),
        [field]: !(prev[module]?.[field]),
      }
    }));
  };

  const handleToggleLogs = () => {
    setEditingPermissions(prev => ({
      ...prev,
      logs: { view: !prev.logs.view },
    }));
  };

  const handleSavePermissions = () => {
    if (!selectedProfile) return;

    updateUserPermissions(selectedProfile.id, editingPermissions);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsConfigModalOpen(false);
      setSelectedProfile(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
            Module Phân Quyền Nhân Sự
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cấu hình chi tiết quyền Xem, Thêm, Sửa, Xóa cho từng nhân viên theo từng module. Đồng bộ tức thì lên Google Sheets sheet PHAN_QUYEN.
          </p>
        </div>

        <button
          onClick={() => syncWithGoogleSheets()}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm active:scale-95"
        >
          <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-orange-600' : ''}`} />
          <span>Làm mới phân quyền</span>
        </button>
      </div>

      {/* Access Guard Notice */}
      {!isAdmin && !canManageUsers && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-800 font-medium">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Bạn đang đăng nhập với quyền xem. Chỉ tài khoản <strong>Admin (Quản trị viên)</strong> mới có thẩm quyền chỉnh sửa ma trận phân quyền cho nhân viên.
          </span>
        </div>
      )}

      {/* Search and Overview Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên nhân viên, email, vai trò..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Tổng số: <strong className="text-slate-800">{filteredProfiles.length}</strong> nhân sự được quản lý
          </div>
        </div>
      </div>

      {/* Permissions Matrix Cards */}
      <div className="space-y-3.5">
        {filteredProfiles.map(person => {
          const perms = getUserPermissions(person);
          const isMe = person.id === currentUser.id;

          return (
            <div
              key={person.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm transition space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={person.full_name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <span>{person.full_name}</span>
                      {isMe && (
                        <span className="text-[10px] px-2 py-0.2 bg-orange-100 text-orange-700 font-bold rounded">
                          Bạn
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span>{person.email}</span>
                      <span>•</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-mono font-bold ${
                        person.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                        person.role === 'manager' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {person.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div>
                  <button
                    onClick={() => handleOpenConfig(person)}
                    disabled={!isAdmin && !canManageUsers}
                    className="w-full sm:w-auto px-4 py-2 bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Cấu hình quyền hạn</span>
                  </button>
                </div>
              </div>

              {/* Permissions Grid Matrix Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
                {/* 1. Thiết Bị */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-orange-600" />
                    <span>Thiết Bị</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.assets.view ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xem: {perms.assets.view ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.assets.create ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Thêm: {perms.assets.create ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.assets.edit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Sửa: {perms.assets.edit ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.assets.delete ? 'bg-rose-100 text-rose-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xóa: {perms.assets.delete ? '✓' : '✕'}
                    </span>
                  </div>
                </div>

                {/* 2. Mượn - Trả */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mượn – Trả</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.transfers.view ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xem: {perms.transfers.view ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.transfers.create ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Giao: {perms.transfers.create ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.transfers.edit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Sửa: {perms.transfers.edit ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.transfers.delete ? 'bg-rose-100 text-rose-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xóa: {perms.transfers.delete ? '✓' : '✕'}
                    </span>
                  </div>
                </div>

                {/* 3. Nhân Sự */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nhân Sự</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.staff.view ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xem: {perms.staff.view ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.staff.create ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Thêm: {perms.staff.create ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.staff.edit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Sửa: {perms.staff.edit ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.staff.delete ? 'bg-rose-100 text-rose-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xóa: {perms.staff.delete ? '✓' : '✕'}
                    </span>
                  </div>
                </div>

                {/* 4. Kiểm Kê */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Kiểm Kê</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.audit.view ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xem: {perms.audit.view ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.audit.create ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Tạo: {perms.audit.create ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.audit.edit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Quét: {perms.audit.edit ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${perms.audit.delete ? 'bg-rose-100 text-rose-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xóa: {perms.audit.delete ? '✓' : '✕'}
                    </span>
                  </div>
                </div>

                {/* 5. Chấm Công */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Chấm Công</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${(perms.attendance?.view ?? true) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xem: {(perms.attendance?.view ?? true) ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-center font-semibold ${(perms.attendance?.create ?? true) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Chấm: {(perms.attendance?.create ?? true) ? '✓' : '✕'}
                    </span>
                    <span className={`col-span-2 px-1.5 py-0.5 rounded text-center font-semibold ${perms.attendance?.delete ? 'bg-rose-100 text-rose-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xóa record: {perms.attendance?.delete ? '✓' : '✕'}
                    </span>
                  </div>
                </div>

                {/* 6. Nhật Ký */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-700" />
                    <span>Nhật Ký</span>
                  </div>
                  <div className="text-[11px]">
                    <span className={`w-full block py-1.5 rounded text-center font-semibold ${perms.logs.view ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                      Xem Log: {perms.logs.view ? 'Có quyền' : 'Bị khóa'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIGURE PERMISSIONS MODAL */}
      {isConfigModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto text-xs animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                  Cấu Hình Phân Quyền Nhân Sự
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Thiết lập cho: <strong className="text-slate-800">{selectedProfile.full_name}</strong> ({selectedProfile.role})
                </p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Đã cập nhật quyền hạn thành công & đồng bộ sang Google Sheets!</span>
                </div>
              )}

              {/* Quick Presets */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Gán nhanh mẫu phân quyền chuẩn:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('admin')}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-left transition group"
                  >
                    <div className="font-bold text-rose-900">👑 Toàn quyền</div>
                    <div className="text-[10px] text-rose-600 mt-0.5">Admin (Bật tất cả)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('manager')}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-left transition group"
                  >
                    <div className="font-bold text-amber-900">📦 Quản lý kho</div>
                    <div className="text-[10px] text-amber-600 mt-0.5">Máy móc & Kiểm kê</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('staff')}
                    className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition group"
                  >
                    <div className="font-bold text-blue-900">📷 Photo / Film</div>
                    <div className="text-[10px] text-blue-600 mt-0.5">Mượn trả & Xem máy</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('readonly')}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-left transition group"
                  >
                    <div className="font-bold text-slate-800">👁️ Chỉ xem</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Không sửa / Không xóa</div>
                  </button>
                </div>
              </div>

              {/* Granular Checkbox Matrix */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Chi tiết quyền hạn từng Module:</h4>

                {/* 1. Thiết Bị */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-orange-600" />
                      Module Thiết Bị
                    </span>
                    <span className="text-[11px] text-slate-500">Quản lý máy ảnh, lens, phụ kiện</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-orange-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.assets.view}
                        onChange={() => handleToggleCrud('assets', 'view')}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">👁️ Xem</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-orange-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.assets.create}
                        onChange={() => handleToggleCrud('assets', 'create')}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">➕ Thêm mới</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-orange-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.assets.edit}
                        onChange={() => handleToggleCrud('assets', 'edit')}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">✏️ Chỉnh sửa</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-rose-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.assets.delete}
                        onChange={() => handleToggleCrud('assets', 'delete')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="font-semibold text-rose-700">🗑️ Xóa</span>
                    </label>
                  </div>
                </div>

                {/* 2. Mượn - Trả */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                      Module Mượn – Trả
                    </span>
                    <span className="text-[11px] text-slate-500">Bàn giao thiết bị và xác nhận</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.transfers.view}
                        onChange={() => handleToggleCrud('transfers', 'view')}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">👁️ Xem</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.transfers.create}
                        onChange={() => handleToggleCrud('transfers', 'create')}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">➕ Tạo bàn giao</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.transfers.edit}
                        onChange={() => handleToggleCrud('transfers', 'edit')}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">✏️ Sửa</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-rose-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.transfers.delete}
                        onChange={() => handleToggleCrud('transfers', 'delete')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="font-semibold text-rose-700">🗑️ Xóa</span>
                    </label>
                  </div>
                </div>

                {/* 3. Nhân Sự */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Module Nhân Sự
                    </span>
                    <span className="text-[11px] text-slate-500">Tài khoản nhân viên, mật khẩu</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.staff.view}
                        onChange={() => handleToggleCrud('staff', 'view')}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">👁️ Xem</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.staff.create}
                        onChange={() => handleToggleCrud('staff', 'create')}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">➕ Thêm</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.staff.edit}
                        onChange={() => handleToggleCrud('staff', 'edit')}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">✏️ Sửa</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-rose-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.staff.delete}
                        onChange={() => handleToggleCrud('staff', 'delete')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="font-semibold text-rose-700">🗑️ Xóa</span>
                    </label>
                  </div>
                </div>

                {/* 4. Kiểm Kê */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-purple-600" />
                      Module Kiểm Kê
                    </span>
                    <span className="text-[11px] text-slate-500">Quét QR & Đối soát thực tế</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-purple-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.audit.view}
                        onChange={() => handleToggleCrud('audit', 'view')}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">👁️ Xem</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-purple-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.audit.create}
                        onChange={() => handleToggleCrud('audit', 'create')}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">➕ Tạo đợt</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-purple-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.audit.edit}
                        onChange={() => handleToggleCrud('audit', 'edit')}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">✏️ Quét QR</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-rose-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.audit.delete}
                        onChange={() => handleToggleCrud('audit', 'delete')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="font-semibold text-rose-700">🗑️ Xóa</span>
                    </label>
                  </div>
                </div>

                {/* 5. Chấm Công */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Module Chấm Công (GPS Check-in)
                    </span>
                    <span className="text-[11px] text-slate-500">Chấm công tại Studio & Đi show cưới</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.attendance?.view ?? true}
                        onChange={() => handleToggleCrud('attendance', 'view')}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">👁️ Xem DS chấm công</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.attendance?.create ?? true}
                        onChange={() => handleToggleCrud('attendance', 'create')}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">➕ Thực hiện chấm công</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-rose-400">
                      <input
                        type="checkbox"
                        checked={editingPermissions.attendance?.delete ?? false}
                        onChange={() => handleToggleCrud('attendance', 'delete')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="font-semibold text-rose-700">🗑️ Xóa bản ghi (Admin/QL)</span>
                    </label>
                  </div>
                </div>

                {/* 6. Nhật Ký */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-700" />
                      Module Nhật Ký Hoạt Động (Logs)
                    </span>
                    <span className="text-[11px] text-slate-500">Audit trail các thay đổi</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 max-w-xs">
                      <input
                        type="checkbox"
                        checked={editingPermissions.logs.view}
                        onChange={handleToggleLogs}
                        className="rounded text-slate-700 focus:ring-slate-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-700">👁️ Quyền xem nhật ký hệ thống</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md shadow-orange-600/25 flex items-center gap-1.5 transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Lưu & Đồng Bộ Sheets</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
