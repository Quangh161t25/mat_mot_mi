'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Boxes, 
  ArrowRightLeft, 
  Users, 
  ClipboardCheck, 
  History, 
  Clock, 
  RotateCcw, 
  ArrowUpDown, 
  Download, 
  Save, 
  CheckSquare, 
  Square, 
  Sparkles,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Filter,
  UserCheck
} from 'lucide-react';

// Định nghĩa danh sách các quyền chi tiết
interface PermissionDefinition {
  id: string;
  moduleKey: 'assets' | 'transfers' | 'attendance' | 'audit' | 'staff' | 'logs';
  permKey: 'view' | 'create' | 'edit' | 'delete';
  moduleTitle: string;
  permTitle: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
}

const PERMISSION_COLUMNS: PermissionDefinition[] = [
  // 1. Thiết Bị
  { id: 'assets_view', moduleKey: 'assets', permKey: 'view', moduleTitle: 'Thiết Bị', permTitle: 'Xem danh sách', shortLabel: 'Xem', badgeBg: 'bg-orange-50 text-orange-700', badgeText: 'text-orange-600' },
  { id: 'assets_create', moduleKey: 'assets', permKey: 'create', moduleTitle: 'Thiết Bị', permTitle: 'Thêm thiết bị mới', shortLabel: 'Thêm', badgeBg: 'bg-orange-50 text-orange-700', badgeText: 'text-orange-600' },
  { id: 'assets_edit', moduleKey: 'assets', permKey: 'edit', moduleTitle: 'Thiết Bị', permTitle: 'Chỉnh sửa thiết bị', shortLabel: 'Sửa', badgeBg: 'bg-orange-50 text-orange-700', badgeText: 'text-orange-600' },
  { id: 'assets_delete', moduleKey: 'assets', permKey: 'delete', moduleTitle: 'Thiết Bị', permTitle: 'Xóa thiết bị', shortLabel: 'Xóa', badgeBg: 'bg-rose-50 text-rose-700', badgeText: 'text-rose-600' },

  // 2. Mượn - Trả
  { id: 'transfers_view', moduleKey: 'transfers', permKey: 'view', moduleTitle: 'Mượn – Trả', permTitle: 'Xem lịch sử bàn giao', shortLabel: 'Xem', badgeBg: 'bg-emerald-50 text-emerald-700', badgeText: 'text-emerald-600' },
  { id: 'transfers_create', moduleKey: 'transfers', permKey: 'create', moduleTitle: 'Mượn – Trả', permTitle: 'Tạo phiếu bàn giao', shortLabel: 'Tạo', badgeBg: 'bg-emerald-50 text-emerald-700', badgeText: 'text-emerald-600' },
  { id: 'transfers_edit', moduleKey: 'transfers', permKey: 'edit', moduleTitle: 'Mượn – Trả', permTitle: 'Sửa thông tin bàn giao', shortLabel: 'Sửa', badgeBg: 'bg-emerald-50 text-emerald-700', badgeText: 'text-emerald-600' },
  { id: 'transfers_delete', moduleKey: 'transfers', permKey: 'delete', moduleTitle: 'Mượn – Trả', permTitle: 'Xóa giao dịch', shortLabel: 'Xóa', badgeBg: 'bg-rose-50 text-rose-700', badgeText: 'text-rose-600' },

  // 3. Chấm Công
  { id: 'attendance_view', moduleKey: 'attendance', permKey: 'view', moduleTitle: 'Chấm Công', permTitle: 'Xem DS chấm công', shortLabel: 'Xem', badgeBg: 'bg-amber-50 text-amber-800', badgeText: 'text-amber-600' },
  { id: 'attendance_create', moduleKey: 'attendance', permKey: 'create', moduleTitle: 'Chấm Công', permTitle: 'Chấm công GPS', shortLabel: 'Chấm', badgeBg: 'bg-amber-50 text-amber-800', badgeText: 'text-amber-600' },
  { id: 'attendance_delete', moduleKey: 'attendance', permKey: 'delete', moduleTitle: 'Chấm Công', permTitle: 'Xóa record chấm công', shortLabel: 'Xóa', badgeBg: 'bg-rose-50 text-rose-700', badgeText: 'text-rose-600' },

  // 4. Kiểm Kê
  { id: 'audit_view', moduleKey: 'audit', permKey: 'view', moduleTitle: 'Kiểm Kê', permTitle: 'Xem đợt kiểm kê', shortLabel: 'Xem', badgeBg: 'bg-purple-50 text-purple-700', badgeText: 'text-purple-600' },
  { id: 'audit_create', moduleKey: 'audit', permKey: 'create', moduleTitle: 'Kiểm Kê', permTitle: 'Tạo đợt kiểm kê mới', shortLabel: 'Tạo', badgeBg: 'bg-purple-50 text-purple-700', badgeText: 'text-purple-600' },
  { id: 'audit_edit', moduleKey: 'audit', permKey: 'edit', moduleTitle: 'Kiểm Kê', permTitle: 'Quét QR kiểm tra', shortLabel: 'Quét', badgeBg: 'bg-purple-50 text-purple-700', badgeText: 'text-purple-600' },
  { id: 'audit_delete', moduleKey: 'audit', permKey: 'delete', moduleTitle: 'Kiểm Kê', permTitle: 'Xóa đợt kiểm kê', shortLabel: 'Xóa', badgeBg: 'bg-rose-50 text-rose-700', badgeText: 'text-rose-600' },

  // 5. Nhân Sự
  { id: 'staff_view', moduleKey: 'staff', permKey: 'view', moduleTitle: 'Nhân Sự', permTitle: 'Xem danh sách nhân sự', shortLabel: 'Xem', badgeBg: 'bg-blue-50 text-blue-700', badgeText: 'text-blue-600' },
  { id: 'staff_create', moduleKey: 'staff', permKey: 'create', moduleTitle: 'Nhân Sự', permTitle: 'Thêm nhân viên mới', shortLabel: 'Thêm', badgeBg: 'bg-blue-50 text-blue-700', badgeText: 'text-blue-600' },
  { id: 'staff_edit', moduleKey: 'staff', permKey: 'edit', moduleTitle: 'Nhân Sự', permTitle: 'Chỉnh sửa nhân viên', shortLabel: 'Sửa', badgeBg: 'bg-blue-50 text-blue-700', badgeText: 'text-blue-600' },
  { id: 'staff_delete', moduleKey: 'staff', permKey: 'delete', moduleTitle: 'Nhân Sự', permTitle: 'Xóa tài khoản nhân viên', shortLabel: 'Xóa', badgeBg: 'bg-rose-50 text-rose-700', badgeText: 'text-rose-600' },

  // 6. Nhật Ký
  { id: 'logs_view', moduleKey: 'logs', permKey: 'view', moduleTitle: 'Nhật Ký', permTitle: 'Xem lịch sử hệ thống', shortLabel: 'Xem', badgeBg: 'bg-slate-100 text-slate-800', badgeText: 'text-slate-600' },
];

// Nhóm các cột theo Module để vẽ tiêu đề nhóm ở Chế độ A
const MODULE_GROUPS = [
  { key: 'assets', label: 'Thiết Bị', icon: Boxes, color: 'text-orange-600', span: 4 },
  { key: 'transfers', label: 'Mượn – Trả', icon: ArrowRightLeft, color: 'text-emerald-600', span: 4 },
  { key: 'attendance', label: 'Chấm Công', icon: Clock, color: 'text-amber-600', span: 3 },
  { key: 'audit', label: 'Kiểm Kê', icon: ClipboardCheck, color: 'text-purple-600', span: 4 },
  { key: 'staff', label: 'Nhân Sự', icon: Users, color: 'text-blue-600', span: 4 },
  { key: 'logs', label: 'Nhật Ký', icon: History, color: 'text-slate-600', span: 1 },
];

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

  // Chế độ hiển thị bảng:
  // 'staff_rows' = Cột trái: Nhân viên, Bên phải: Module & Quyền
  // 'module_rows' = Cột trái: Module & Quyền, Bên phải: Danh sách Nhân viên
  const [viewMode, setViewMode] = useState<'staff_rows' | 'module_rows'>('staff_rows');

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'staff'>('all');

  // Tùy chọn lưu tự động ngay khi click
  const [autoSave, setAutoSave] = useState(true);

  // Ma trận quyền hạn lưu trong state nội bộ: { [userId]: UserPermissions }
  const [matrix, setMatrix] = useState<Record<string, UserPermissions>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Khởi tạo ma trận từ danh sách profiles
  useEffect(() => {
    const initial: Record<string, UserPermissions> = {};
    profiles.forEach(p => {
      initial[p.id] = JSON.parse(JSON.stringify(getUserPermissions(p)));
    });
    setMatrix(initial);
    setHasChanges(false);
  }, [profiles]);

  // Lọc danh sách nhân sự
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchSearch = 
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase());
      
      const matchRole = roleFilter === 'all' || p.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [profiles, search, roleFilter]);

  // Kiểm tra 1 quyền cụ thể của 1 user
  const checkPermission = (userId: string, moduleKey: string, permKey: string): boolean => {
    const userPerms = matrix[userId];
    if (!userPerms) return false;

    if (moduleKey === 'logs') {
      return Boolean(userPerms.logs?.view);
    }

    const mod = (userPerms as any)[moduleKey];
    if (!mod) {
      if (moduleKey === 'attendance') {
        return permKey === 'view' || permKey === 'create';
      }
      return false;
    }
    return Boolean(mod[permKey]);
  };

  // Toggle bật/tắt 1 quyền trong bảng
  const handleToggleCell = (userId: string, moduleKey: string, permKey: string) => {
    if (!isAdmin && !canManageUsers) return;

    const currentVal = checkPermission(userId, moduleKey, permKey);
    const newVal = !currentVal;

    const currentUserPerms = matrix[userId] || JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_BY_ROLE.staff));
    let updatedPerms: UserPermissions;

    if (moduleKey === 'logs') {
      updatedPerms = {
        ...currentUserPerms,
        logs: { view: newVal }
      };
    } else {
      const mod = (currentUserPerms as any)[moduleKey] || { view: true, create: true, edit: false, delete: false };
      updatedPerms = {
        ...currentUserPerms,
        [moduleKey]: {
          ...mod,
          [permKey]: newVal
        }
      };
    }

    setMatrix(prev => ({ ...prev, [userId]: updatedPerms }));
    setHasChanges(true);

    if (autoSave) {
      updateUserPermissions(userId, updatedPerms);
      setSaveSuccessMsg('Đã lưu & đồng bộ tức thì lên Google Sheets');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    }
  };

  // Áp dụng Preset mẫu nhanh cho 1 nhân sự
  const handleApplyUserPreset = (userId: string, preset: 'admin' | 'manager' | 'staff' | 'readonly' | 'all' | 'none') => {
    if (!isAdmin && !canManageUsers) return;

    let targetPerms: UserPermissions;
    if (preset === 'all') {
      targetPerms = {
        assets: { view: true, create: true, edit: true, delete: true },
        transfers: { view: true, create: true, edit: true, delete: true },
        staff: { view: true, create: true, edit: true, delete: true },
        audit: { view: true, create: true, edit: true, delete: true },
        attendance: { view: true, create: true, edit: true, delete: true },
        logs: { view: true },
      };
    } else if (preset === 'none') {
      targetPerms = {
        assets: { view: false, create: false, edit: false, delete: false },
        transfers: { view: false, create: false, edit: false, delete: false },
        staff: { view: false, create: false, edit: false, delete: false },
        audit: { view: false, create: false, edit: false, delete: false },
        attendance: { view: false, create: false, edit: false, delete: false },
        logs: { view: false },
      };
    } else if (preset === 'readonly') {
      targetPerms = {
        assets: { view: true, create: false, edit: false, delete: false },
        transfers: { view: true, create: false, edit: false, delete: false },
        staff: { view: true, create: false, edit: false, delete: false },
        audit: { view: true, create: false, edit: false, delete: false },
        attendance: { view: true, create: false, edit: false, delete: false },
        logs: { view: true },
      };
    } else {
      targetPerms = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_BY_ROLE[preset]));
    }

    setMatrix(prev => ({ ...prev, [userId]: targetPerms }));
    setHasChanges(true);

    if (autoSave) {
      updateUserPermissions(userId, targetPerms);
      setSaveSuccessMsg('Đã áp dụng mẫu phân quyền và đồng bộ!');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    }
  };

  // Áp dụng bật/tắt toàn bộ cho 1 quyền cụ thể (áp dụng cho tất cả nhân viên)
  const handleToggleAllUsersForPermission = (moduleKey: string, permKey: string, targetState: boolean) => {
    if (!isAdmin && !canManageUsers) return;

    const newMatrix = { ...matrix };
    filteredProfiles.forEach(p => {
      const uPerms = newMatrix[p.id] || JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS_BY_ROLE.staff));
      if (moduleKey === 'logs') {
        newMatrix[p.id] = { ...uPerms, logs: { view: targetState } };
      } else {
        const mod = (uPerms as any)[moduleKey] || { view: true, create: true, edit: false, delete: false };
        newMatrix[p.id] = {
          ...uPerms,
          [moduleKey]: { ...mod, [permKey]: targetState }
        };
      }
      if (autoSave) {
        updateUserPermissions(p.id, newMatrix[p.id]);
      }
    });

    setMatrix(newMatrix);
    setHasChanges(true);
    if (autoSave) {
      setSaveSuccessMsg(`Đã ${targetState ? 'bật' : 'tắt'} quyền cho tất cả nhân viên`);
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    }
  };

  // Nút Lưu toàn bộ ma trận thay đổi vào Google Sheets
  const handleSaveAll = async () => {
    if (!isAdmin && !canManageUsers) return;

    setIsSavingAll(true);
    try {
      for (const p of profiles) {
        const perms = matrix[p.id];
        if (perms) {
          updateUserPermissions(p.id, perms);
        }
      }
      setHasChanges(false);
      setSaveSuccessMsg('Đã lưu toàn bộ ma trận phân quyền vào Google Sheets thành công!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } finally {
      setIsSavingAll(false);
    }
  };

  // Xuất ma trận phân quyền ra file CSV
  const handleExportCSV = () => {
    const headers = ['Mã NV', 'Họ tên', 'Email', 'Vai trò', ...PERMISSION_COLUMNS.map(c => `${c.moduleTitle} - ${c.permTitle}`)];
    const rows = filteredProfiles.map(p => {
      const perms = PERMISSION_COLUMNS.map(c => checkPermission(p.id, c.moduleKey, c.permKey) ? 'Có' : 'Không');
      return [p.id, `"${p.full_name}"`, p.email, p.role, ...perms];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ma_Tran_Phan_Quyen_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Đếm tổng số quyền được bật của 1 user
  const countEnabledPerms = (userId: string) => {
    return PERMISSION_COLUMNS.filter(c => checkPermission(userId, c.moduleKey, c.permKey)).length;
  };

  return (
    <div className="space-y-5 pb-16">
      {/* ======================================================== */}
      {/* 1. HEADER & TOP TOOLBAR */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
            Ma Trận Phân Quyền Dạng Bảng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Xem và cấu hình trực tiếp quyền hạn dạng bảng tính (Grid Matrix). Click trực tiếp vào các ô để bật/tắt quyền tức thì.
          </p>
        </div>

        {/* Nút hành động trên cùng */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* NÚT ĐỔI CHIỀU BẢNG (SWAP VIEW) */}
          <button
            type="button"
            onClick={() => setViewMode(prev => prev === 'staff_rows' ? 'module_rows' : 'staff_rows')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-orange-600/25 transition active:scale-95"
            title="Đổi chỗ danh sách nhân viên và danh sách module"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>
              {viewMode === 'staff_rows' 
                ? 'Đổi Chiều: Module làm Hàng ⇄ Nhân Viên làm Cột' 
                : 'Đổi Chiều: Nhân Viên làm Hàng ⇄ Module làm Cột'}
            </span>
          </button>

          <button
            onClick={() => syncWithGoogleSheets()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition shadow-sm active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-600' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Thông báo kết quả lưu */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 font-bold shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cảnh báo quyền truy cập */}
      {!isAdmin && !canManageUsers && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-800 font-medium">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Bạn đang ở chế độ xem. Chỉ tài khoản <strong>Admin</strong> mới có quyền nhấp thay đổi các ô trong bảng ma trận.
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. THANH CÔNG CỤ TÌM KIẾM, LỌC & CÀI ĐẶT LƯU */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {/* Tìm kiếm */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên nhân viên, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>

          {/* Lọc vai trò */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-orange-500"
          >
            <option value="all">Tất cả vai trò ({profiles.length})</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="manager">Quản lý (Manager)</option>
            <option value="staff">Nhân viên (Staff)</option>
          </select>
        </div>

        {/* Tùy chọn lưu & nút Lưu */}
        <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={e => setAutoSave(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
            />
            <span>Lưu tự động ngay khi click</span>
          </label>

          {hasChanges && !autoSave && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition active:scale-95 animate-pulse"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingAll ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MA TRẬN DẠNG BẢNG: 2 CHẾ ĐỘ CÓ THỂ ĐỔI CHỖ CHO NHAU */}
      {/* ======================================================== */}

      {/* -------------------------------------------------------- */}
      {/* CHẾ ĐỘ A: CỘT TRÁI = NHÂN VIÊN, CỘT BÊN PHẢI = MODULES & QUYỀN */}
      {/* -------------------------------------------------------- */}
      {viewMode === 'staff_rows' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          {/* Chú thích chế độ */}
          <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
              <span>Chế độ 1: <strong>Nhân Viên</strong> theo dòng dọc (Cột trái) ⇄ <strong>Module & Quyền</strong> theo cột ngang (Bên phải)</span>
            </div>
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
              Cuộn ngang để xem đủ 20 quyền chi tiết
            </span>
          </div>

          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full text-left border-collapse text-xs">
              {/* Table Header: 2 tầng */}
              <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md shadow-xs select-none">
                {/* Tầng 1: Tên các Module */}
                <tr className="border-b border-slate-200">
                  {/* Cột cố định trái: Nhân viên */}
                  <th 
                    rowSpan={2} 
                    className="sticky left-0 z-30 bg-slate-100 p-3.5 min-w-[240px] max-w-[280px] font-black text-slate-900 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span>Nhân Viên ({filteredProfiles.length})</span>
                      </div>
                    </div>
                  </th>

                  {/* Các nhóm Module */}
                  {MODULE_GROUPS.map(group => {
                    const Icon = group.icon;
                    return (
                      <th
                        key={group.key}
                        colSpan={group.span}
                        className="p-2.5 text-center font-black border-r border-slate-200 last:border-r-0 text-slate-800 text-[11px] sm:text-xs"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${group.color}`} />
                          <span>{group.label}</span>
                        </div>
                      </th>
                    );
                  })}

                  {/* Cột Thao tác Preset nhanh */}
                  <th rowSpan={2} className="p-3 text-center font-bold text-slate-700 min-w-[130px]">
                    Thao Tác Nhanh
                  </th>
                </tr>

                {/* Tầng 2: Tên các quyền con (Xem, Thêm, Sửa, Xóa) */}
                <tr className="border-b border-slate-200 text-[11px] text-slate-600">
                  {PERMISSION_COLUMNS.map(col => (
                    <th
                      key={col.id}
                      className="p-2 text-center min-w-[56px] border-r border-slate-200/80 font-bold hover:bg-slate-200/50 transition"
                      title={`${col.moduleTitle} - ${col.permTitle}`}
                    >
                      <span className={`px-1 py-0.5 rounded text-[10px] ${col.badgeBg}`}>
                        {col.shortLabel}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body: Mỗi dòng là 1 nhân viên */}
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={PERMISSION_COLUMNS.length + 2} className="p-8 text-center text-slate-400">
                      Không tìm thấy nhân viên nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map(person => {
                    const isMe = person.id === currentUser.id;
                    const enabledCount = countEnabledPerms(person.id);

                    return (
                      <tr 
                        key={person.id} 
                        className="hover:bg-orange-50/30 transition group"
                      >
                        {/* Cột trái cố định: Thông tin nhân viên */}
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-orange-50/40 p-3 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] transition">
                          <div className="flex items-center gap-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={person.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={person.full_name}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs sm:text-sm truncate flex items-center gap-1.5">
                                <span>{person.full_name}</span>
                                {isMe && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-orange-100 text-orange-700 font-bold rounded shrink-0">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                                  person.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                                  person.role === 'manager' ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {person.role.toUpperCase()}
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-slate-600">{enabledCount}/20 quyền</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Các ô Checkbox quyền */}
                        {PERMISSION_COLUMNS.map(col => {
                          const isChecked = checkPermission(person.id, col.moduleKey, col.permKey);

                          return (
                            <td
                              key={col.id}
                              onClick={() => handleToggleCell(person.id, col.moduleKey, col.permKey)}
                              className={`p-2 text-center border-r border-slate-100 cursor-pointer transition select-none ${
                                isChecked ? 'bg-emerald-50/40 hover:bg-emerald-100/60' : 'hover:bg-slate-100/80'
                              } ${!isAdmin && !canManageUsers ? 'cursor-not-allowed opacity-75' : ''}`}
                              title={`${person.full_name}: ${col.moduleTitle} - ${col.permTitle} (${isChecked ? 'BẬT' : 'TẮT'})`}
                            >
                              <div className="flex items-center justify-center">
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                                  isChecked 
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105' 
                                    : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                                }`}>
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </div>
                            </td>
                          );
                        })}

                        {/* Cột Preset mẫu nhanh */}
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleApplyUserPreset(person.id, 'admin')}
                              className="px-2 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg transition"
                              title="Bật toàn bộ quyền (Admin)"
                            >
                              Admin
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyUserPreset(person.id, 'manager')}
                              className="px-2 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 rounded-lg transition"
                              title="Áp dụng mẫu Quản lý"
                            >
                              QL
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyUserPreset(person.id, 'staff')}
                              className="px-2 py-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition"
                              title="Áp dụng mẫu Nhân viên"
                            >
                              NV
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyUserPreset(person.id, 'none')}
                              className="px-1.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 rounded-lg transition"
                              title="Tắt toàn bộ quyền"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/* CHẾ ĐỘ B: CỘT TRÁI = MODULE & QUYỀN, CỘT BÊN PHẢI = NHÂN VIÊN */}
      {/* -------------------------------------------------------- */}
      {viewMode === 'module_rows' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          {/* Chú thích chế độ */}
          <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Chế độ 2: <strong>Module & Quyền</strong> theo dòng dọc (Cột trái) ⇄ <strong>Nhân Viên</strong> theo cột ngang (Bên phải)</span>
            </div>
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
              Xem và đối soát theo từng quyền hạn cụ thể
            </span>
          </div>

          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full text-left border-collapse text-xs">
              {/* Table Header: Danh sách các nhân viên */}
              <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md shadow-xs select-none">
                <tr className="border-b border-slate-200">
                  {/* Cột cố định trái: Module & Quyền */}
                  <th className="sticky left-0 z-30 bg-slate-100 p-3.5 min-w-[260px] max-w-[320px] font-black text-slate-900 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-orange-600" />
                        <span>Module & Quyền Hạn (20)</span>
                      </div>
                    </div>
                  </th>

                  {/* Mỗi nhân viên là 1 cột */}
                  {filteredProfiles.map(person => {
                    const isMe = person.id === currentUser.id;
                    const enabledCount = countEnabledPerms(person.id);

                    return (
                      <th
                        key={person.id}
                        className="p-3 text-center min-w-[130px] border-r border-slate-200/80 font-bold hover:bg-slate-200/50 transition align-top"
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={person.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={person.full_name}
                            className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div className="text-center">
                            <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                              {person.full_name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {person.role.toUpperCase()}
                            </div>
                            <div className="text-[9px] text-emerald-700 font-semibold">
                              {enabledCount} quyền bật
                            </div>
                          </div>

                          {/* Quick preset buttons per column */}
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              type="button"
                              onClick={() => handleApplyUserPreset(person.id, 'all')}
                              className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded text-[9px] font-bold"
                              title="Bật hết"
                            >
                              Tất cả
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyUserPreset(person.id, 'none')}
                              className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded text-[9px] font-bold"
                              title="Tắt hết"
                            >
                              Tắt
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body: Mỗi dòng là 1 Quyền của Module */}
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_COLUMNS.map((col, index) => {
                  // Đặt phân cách trực quan khi đổi sang module mới
                  const isFirstOfModule = index === 0 || PERMISSION_COLUMNS[index - 1].moduleKey !== col.moduleKey;

                  return (
                    <React.Fragment key={col.id}>
                      {/* Tiêu đề phân cách Module nếu bắt đầu nhóm mới */}
                      {isFirstOfModule && (
                        <tr className="bg-slate-100/70 border-y border-slate-200 font-black text-slate-800 text-xs">
                          <td 
                            colSpan={filteredProfiles.length + 1}
                            className="py-2 px-4 sticky left-0 z-10 bg-slate-100 font-bold"
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-600" />
                              <span>Module {col.moduleTitle}</span>
                            </span>
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-orange-50/30 transition group">
                        {/* Cột trái cố định: Tên quyền & Module */}
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-orange-50/40 p-3 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] transition">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${col.badgeBg}`}>
                                  {col.shortLabel}
                                </span>
                                <span>{col.permTitle}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Thuộc module: <strong className="text-slate-600">{col.moduleTitle}</strong>
                              </div>
                            </div>

                            {/* Nút bật/tắt cả dòng cho tất cả nhân viên */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleAllUsersForPermission(col.moduleKey, col.permKey, true)}
                                className="px-1.5 py-0.5 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-500 rounded text-[9px] font-bold"
                                title="Bật quyền này cho tất cả nhân viên"
                              >
                                Bật hết
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleAllUsersForPermission(col.moduleKey, col.permKey, false)}
                                className="px-1.5 py-0.5 bg-slate-50 hover:bg-rose-600 hover:text-white text-slate-500 rounded text-[9px] font-bold"
                                title="Tắt quyền này cho tất cả nhân viên"
                              >
                                Tắt hết
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Các ô Checkbox theo từng nhân viên */}
                        {filteredProfiles.map(person => {
                          const isChecked = checkPermission(person.id, col.moduleKey, col.permKey);

                          return (
                            <td
                              key={person.id}
                              onClick={() => handleToggleCell(person.id, col.moduleKey, col.permKey)}
                              className={`p-2.5 text-center border-r border-slate-100 cursor-pointer transition select-none ${
                                isChecked ? 'bg-emerald-50/40 hover:bg-emerald-100/60' : 'hover:bg-slate-100/80'
                              } ${!isAdmin && !canManageUsers ? 'cursor-not-allowed opacity-75' : ''}`}
                              title={`${person.full_name}: ${col.moduleTitle} - ${col.permTitle} (${isChecked ? 'BẬT' : 'TẮT'})`}
                            >
                              <div className="flex items-center justify-center">
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                                  isChecked 
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105' 
                                    : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                                }`}>
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. CHÚ THÍCH & HƯỚNG DẪN */}
      {/* ======================================================== */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-xs text-slate-600 space-y-3">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-600" />
          Quy định & Hướng dẫn sử dụng ma trận phân quyền:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Click ô trực tiếp</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Nhấp trực tiếp vào ô vuông để bật hoặc tắt quyền. Nếu bật "Lưu tự động", mọi thay đổi sẽ đồng bộ ngay lập tức lên Google Sheets tab PHAN_QUYEN.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Đổi chiều linh hoạt</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Bấm nút <strong>"Đổi Chiều"</strong> màu cam ở góc trên để hoán đổi danh sách nhân viên sang cột ngang hoặc dòng dọc tùy theo thói quen quan sát.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Preset mẫu 1 chạm</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Các nút <strong>Admin, QL, NV</strong> giúp nhanh chóng gán bộ quyền chuẩn cho nhân viên mà không cần tích từng ô thủ công.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}