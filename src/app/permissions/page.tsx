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
  // Hai cột đầu đổi chỗ và nhóm theo nhân viên hoặc module.
  const [viewMode, setViewMode] = useState<'staff_rows' | 'module_rows'>('staff_rows');

  const [layout, setLayout] = useState<'table' | 'detail'>('detail');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedModuleKey, setSelectedModuleKey] = useState('assets');

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

  const selectedStaff = filteredProfiles.find(person => person.id === selectedStaffId) || filteredProfiles[0];
  const selectedModule = MODULE_GROUPS.find(group => group.key === selectedModuleKey) || MODULE_GROUPS[0];
  const visibleProfiles = layout === 'detail' && viewMode === 'staff_rows'
    ? (selectedStaff ? [selectedStaff] : []) : filteredProfiles;
  const visibleModules = layout === 'detail' && viewMode === 'module_rows'
    ? [selectedModule] : MODULE_GROUPS;

  const permissionRows = viewMode === 'staff_rows'
    ? visibleProfiles.flatMap(person => visibleModules.map((group, index) => ({ person, group, first: index === 0 })))
    : visibleModules.flatMap(group => visibleProfiles.map((person, index) => ({ person, group, first: index === 0 })));

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
                ? 'Đổi chỗ: Module → Nhân viên'
                : 'Đổi chỗ: Nhân viên → Module'}
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

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Kiểu xem phân quyền">
        {([{ key: 'table', label: 'Bảng tổng' }, { key: 'detail', label: 'Xem chi tiết' }] as const).map(item => (
          <button key={item.key} type="button" aria-pressed={layout === item.key} onClick={() => setLayout(item.key)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${layout === item.key ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{item.label}</button>
        ))}
        {layout === 'detail' && <span className="text-xs text-slate-500">{viewMode === 'staff_rows' ? 'Chọn nhân viên để xem quyền theo module' : 'Chọn module để xem quyền của từng nhân viên'}</span>}
      </div>

      {layout === 'detail' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200" role="group" aria-label="Xem theo nhân viên hoặc module">
            <button type="button" aria-pressed={viewMode === 'staff_rows'} onClick={() => setViewMode('staff_rows')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === 'staff_rows' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}><Users className="w-4 h-4" />Theo nhân viên</button>
            <button type="button" aria-pressed={viewMode === 'module_rows'} onClick={() => setViewMode('module_rows')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === 'module_rows' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}><Boxes className="w-4 h-4" />Theo module</button>
          </div>
          <span className="text-xs text-slate-500">{viewMode === 'staff_rows' ? 'Nhân viên bên trái → Module và quyền bên phải' : 'Module bên trái → Nhân viên và quyền bên phải'}</span>
        </div>
      )}

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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 flex-wrap">
          {/* Tìm kiếm */}
          <div className="relative sm:flex-1 min-w-0 w-full sm:min-w-[220px] sm:max-w-sm">
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

      <div className={layout === 'detail' ? 'grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-4 items-start' : ''}>
        {layout === 'detail' && (
          <aside className="bg-white border border-slate-200 rounded-2xl overflow-hidden" aria-label={viewMode === 'staff_rows' ? 'Danh sách nhân viên' : 'Danh sách module'}>
            <div className="p-3 border-b bg-slate-50 font-bold text-sm text-slate-700">{viewMode === 'staff_rows' ? 'Nhân viên' : 'Module'}</div>
            <div className="md:hidden p-3">
              <select aria-label={viewMode === 'staff_rows' ? 'Chọn nhân viên' : 'Chọn module'} value={viewMode === 'staff_rows' ? selectedStaff?.id || '' : selectedModule.key} onChange={event => viewMode === 'staff_rows' ? setSelectedStaffId(event.target.value) : setSelectedModuleKey(event.target.value)} className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800">
                {viewMode === 'staff_rows' ? (filteredProfiles.length ? filteredProfiles.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>) : <option value="">Không có nhân viên phù hợp</option>) : MODULE_GROUPS.map(group => <option key={group.key} value={group.key}>{group.label}</option>)}
              </select>
              {viewMode === 'staff_rows' && selectedStaff && (isAdmin || canManageUsers) && <select aria-label="Mẫu quyền cho nhân viên đang chọn" value="" onChange={event => handleApplyUserPreset(selectedStaff.id, event.target.value as 'admin' | 'manager' | 'staff' | 'none')} className="w-full mt-2 p-2 border border-slate-200 rounded-xl bg-white text-slate-700"><option value="" disabled>Mẫu quyền nhanh</option><option value="admin">Admin</option><option value="manager">Quản lý</option><option value="staff">Nhân viên</option><option value="none">Tắt tất cả</option></select>}
            </div>
            <div className="hidden md:block max-h-[70vh] overflow-y-auto p-2 space-y-1">
              {viewMode === 'staff_rows' ? (filteredProfiles.length ? filteredProfiles.map(person => (
                <button type="button" key={person.id} aria-pressed={selectedStaff?.id === person.id} onClick={() => setSelectedStaffId(person.id)} className={`w-full text-left p-3 rounded-xl transition ${selectedStaff?.id === person.id ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <span className="block text-sm font-semibold break-words">{person.full_name}</span>
                  <span className="block mt-1 text-xs text-slate-500">{person.role === 'admin' ? 'Admin' : person.role === 'manager' ? 'Quản lý' : 'Nhân viên'} · {countEnabledPerms(person.id)}/{PERMISSION_COLUMNS.length} quyền</span>
                </button>
              )) : <p className="p-3 text-xs text-slate-500">Không tìm thấy nhân viên phù hợp.</p>) : MODULE_GROUPS.map(group => {
                const Icon = group.icon;
                return <button type="button" key={group.key} aria-pressed={selectedModule.key === group.key} onClick={() => setSelectedModuleKey(group.key)} className={`w-full flex items-center gap-2 text-left p-3 rounded-xl text-sm font-semibold transition ${selectedModule.key === group.key ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' : 'text-slate-700 hover:bg-slate-50'}`}><Icon className={`w-4 h-4 ${group.color}`} />{group.label}</button>;
              })}
            </div>
          </aside>
        )}
      <div className="min-w-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b bg-slate-50 text-xs text-slate-600">
          {layout === 'detail' ? (viewMode === 'staff_rows' ? `Phân quyền: ${selectedStaff?.full_name || 'Chưa chọn nhân viên'}` : `Module: ${selectedModule.label}`) : (viewMode === 'staff_rows' ? 'Nhóm theo nhân viên' : 'Nhóm theo module')} · {visibleProfiles.length} nhân viên · {visibleModules.length} module
        </div>
        <div className="md:hidden p-3 space-y-3">
          {permissionRows.length === 0 && <p className="p-4 text-center text-sm text-slate-500">Không tìm thấy nhân viên phù hợp.</p>}
          {permissionRows.map(({person, group}) => (
            <section key={`${person.id}-${group.key}`} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-200">
                {(layout === 'table' || viewMode === 'module_rows') && <button type="button" onClick={() => { setSelectedStaffId(person.id); setViewMode('staff_rows'); setLayout('detail'); }} className="block text-sm font-bold text-slate-900 text-left">{person.full_name}</button>}
                {(layout === 'table' || viewMode === 'staff_rows') && <button type="button" onClick={() => { setSelectedModuleKey(group.key); setViewMode('module_rows'); setLayout('detail'); }} className="block text-sm font-semibold text-orange-700 text-left">{group.label}</button>}
              </div>
              <div className="grid grid-cols-4 divide-x divide-slate-100">
                {(['view', 'create', 'edit', 'delete'] as const).map((permKey, index) => {
                  const definition = PERMISSION_COLUMNS.find(col => col.moduleKey === group.key && col.permKey === permKey);
                  return <label key={permKey} className={`flex flex-col items-center gap-3 py-4 text-xs font-semibold ${definition ? 'text-slate-700' : 'text-slate-300'}`}>
                    {['Xem', 'Thêm', 'Sửa', 'Xóa'][index]}
                    {definition ? <input type="checkbox" checked={checkPermission(person.id, group.key, permKey)} disabled={!isAdmin && !canManageUsers} onChange={() => handleToggleCell(person.id, group.key, permKey)} aria-label={`${person.full_name} · ${group.label} · ${definition.permTitle}`} className="accent-emerald-600" /> : <span>—</span>}
                  </label>;
                })}
              </div>
            </section>
          ))}
        </div>
        <div className="hidden md:block overflow-auto max-h-[75vh]">
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 text-slate-700">
              <tr>
                {layout === 'table' && <th scope="col" className="p-3 text-left border-r border-b w-[28%]">{viewMode === 'staff_rows' ? 'Nhân viên' : 'Module'}</th>}
                <th scope="col" className="p-3 text-left border-r border-b w-[28%]">{viewMode === 'staff_rows' ? 'Module' : 'Nhân viên'}</th>
                {['Xem', 'Thêm', 'Sửa', 'Xóa'].map(label => <th scope="col" key={label} className="p-3 text-center border-r border-b last:border-r-0">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.length === 0 ? (
                <tr><td colSpan={layout === 'detail' ? 5 : 6} className="p-10 text-center text-slate-500">Không tìm thấy nhân viên phù hợp.</td></tr>
              ) : (viewMode === 'staff_rows'
                ? visibleProfiles.flatMap(person => visibleModules.map((group, index) => ({ person, group, first: index === 0 })))
                : visibleModules.flatMap(group => visibleProfiles.map((person, index) => ({ person, group, first: index === 0 })))
              ).map(({ person, group, first }) => {
                const staffCell = (
                  <div>
                    <div className="font-semibold text-slate-900"><button type="button" onClick={() => { setSelectedStaffId(person.id); setViewMode('staff_rows'); setLayout('detail'); }} className="text-left hover:text-orange-600 hover:underline">{person.full_name}</button>{person.id === currentUser.id && <span className="ml-2 text-xs text-orange-600">(Bạn)</span>}</div>
                    <div className="mt-1 text-xs text-slate-500">{person.role === 'admin' ? 'Admin' : person.role === 'manager' ? 'Quản lý' : 'Nhân viên'} · {countEnabledPerms(person.id)}/{PERMISSION_COLUMNS.length} quyền</div>
                    {(isAdmin || canManageUsers) && <select aria-label={`Áp dụng mẫu quyền cho ${person.full_name}`} value="" onChange={e => handleApplyUserPreset(person.id, e.target.value as 'admin' | 'manager' | 'staff' | 'none')} className="mt-2 max-w-full rounded border border-slate-200 p-1 text-xs bg-white">
                      <option value="" disabled>Mẫu quyền nhanh</option>
                      <option value="admin">Admin</option><option value="manager">Quản lý</option><option value="staff">Nhân viên</option><option value="none">Tắt tất cả</option>
                    </select>}
                  </div>
                );
                const Icon = group.icon;
                const moduleCell = <div className="flex items-center gap-2 font-semibold text-slate-700"><Icon className={`w-4 h-4 shrink-0 ${group.color}`} /><button type="button" onClick={() => { setSelectedModuleKey(group.key); setViewMode('module_rows'); setLayout('detail'); }} className="text-left hover:text-orange-600 hover:underline">{group.label}</button></div>;
                return (
                  <tr key={`${person.id}-${group.key}`} className={`hover:bg-orange-50/30 ${first ? 'border-t-2 border-slate-200' : 'border-t border-slate-100'}`}>
                    {layout === 'table' && first && <th scope="rowgroup" rowSpan={viewMode === 'staff_rows' ? MODULE_GROUPS.length : filteredProfiles.length} className="p-3 text-left align-top border-r border-slate-200 bg-slate-50/70">{viewMode === 'staff_rows' ? staffCell : moduleCell}</th>}
                    <th scope="row" className="p-3 text-left border-r border-slate-200 font-normal">{viewMode === 'staff_rows' ? moduleCell : staffCell}</th>
                    {(['view', 'create', 'edit', 'delete'] as const).map(permKey => {
                      const definition = PERMISSION_COLUMNS.find(col => col.moduleKey === group.key && col.permKey === permKey);
                      const checked = checkPermission(person.id, group.key, permKey);
                      return <td key={permKey} className="p-3 text-center border-r border-slate-100 last:border-r-0">
                        {definition ? <input type="checkbox" checked={checked} disabled={!isAdmin && !canManageUsers} onChange={() => handleToggleCell(person.id, group.key, permKey)} aria-label={`${person.full_name} · ${group.label} · ${definition.permTitle}`} className="w-5 h-5 rounded accent-emerald-600 cursor-pointer disabled:cursor-not-allowed" /> : <span className="text-slate-300" title="Module không hỗ trợ quyền này">—</span>}
                      </td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      </div>

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
              Nhấp trực tiếp vào ô vuông để bật hoặc tắt quyền. Nếu bật &quot;Lưu tự động&quot;, mọi thay đổi sẽ đồng bộ ngay lập tức lên Google Sheets tab PHAN_QUYEN.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Đổi chiều linh hoạt</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Bấm nút <strong>&quot;Đổi chỗ&quot;</strong> màu cam để hoán đổi hai cột Nhân viên và Module. Bảng được nhóm theo cột đứng đầu; các cột Xem, Thêm, Sửa, Xóa giữ nguyên.
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