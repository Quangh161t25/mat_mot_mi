'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserProfile, UserRole } from '@/types';
import { 
  Users, 
  UserPlus, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Search, 
  Phone, 
  Mail, 
  Check, 
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  CheckSquare,
  Square,
  Boxes,
  ArrowRightLeft
} from 'lucide-react';

export default function StaffPage() {
  const { 
    profiles, 
    assets, 
    transfers, 
    canManageUsers, 
    addProfile, 
    updateProfile, 
    deleteProfile,
    batchDeleteProfiles,
    toggleProfileLock, 
    currentUser 
  } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Selection for Batch Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  // New staff form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [password, setPassword] = useState('123456');
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Edit staff form state
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('staff');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'locked'>('active');
  const [showEditPassword, setShowEditPassword] = useState(false);

  const filteredProfiles = profiles.filter(p => {
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const matchesSearch = 
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    return matchesRole && matchesSearch;
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    addProfile({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      status: 'active',
      password: password.trim() || '123456',
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=150&auto=format&fit=crop&q=80`,
    });

    setIsAddModalOpen(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('123456');
    setRole('staff');
  };

  const handleOpenEdit = (person: UserProfile) => {
    setEditingProfile(person);
    setEditFullName(person.full_name);
    setEditEmail(person.email);
    setEditPhone(person.phone || '');
    setEditRole(person.role);
    setEditPassword(person.password || (person.role === 'admin' ? 'admin' : '123456'));
    setEditStatus(person.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    updateProfile(editingProfile.id, {
      full_name: editFullName.trim(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      role: editRole,
      password: editPassword.trim() || '123456',
      status: editStatus,
    });

    setEditingProfile(null);
  };

  const handleDeleteSingle = (person: UserProfile) => {
    if (person.id === currentUser.id) {
      alert('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn XÓA nhân sự "${person.full_name}" khỏi danh sách và Google Sheets?`)) {
      const res = deleteProfile(person.id);
      if (!res.success) {
        alert(res.error);
      } else {
        setSelectedIds(prev => prev.filter(id => id !== person.id));
      }
    }
  };

  const handleToggleSelect = (id: string) => {
    if (id === currentUser.id) return; // Prevent selecting oneself for deletion
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const selectable = filteredProfiles.filter(p => p.id !== currentUser.id);
    if (selectedIds.length === selectable.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable.map(p => p.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn có chắc muốn XÓA ${selectedIds.length} nhân sự đã chọn khỏi hệ thống và Google Sheets?`)) {
      batchDeleteProfiles(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            Quản Lý Nhân Sự Mắt Một Mí Media
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cài đặt mật khẩu đăng nhập, xem chi tiết hồ sơ, chỉnh sửa, khóa và xóa nhân sự
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Nhân Sự & Mật Khẩu</span>
          </button>
        )}
      </div>

      {/* Flexible Team & Policy Notice */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3 text-xs shadow-sm">
        <div className="p-2 bg-orange-100 text-orange-700 rounded-xl shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-orange-950 text-sm">Chính sách nhân sự & bảo mật tài khoản:</h4>
          <p className="text-orange-900/80">
            • <strong>Mật khẩu đăng nhập:</strong> Mỗi nhân viên có mật khẩu riêng để đăng nhập vào app và xác nhận bàn giao.<br />
            • <strong>Khóa & Xóa:</strong> Nhân sự nghỉ việc có thể chọn Khóa tài khoản (bảo toàn lịch sử) hoặc Xóa hoàn toàn.
          </p>
        </div>
      </div>

      {/* Search & Role Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email, số điện thoại..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-orange-500 font-medium"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="manager">Quản lý kho / Thiết bị</option>
            <option value="staff">Nhân sự (Photo / Film / Assistant)</option>
          </select>
        </div>

        {/* Multi-select Batch Actions Bar */}
        {canManageUsers && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
              >
                {selectedIds.length > 0 && selectedIds.length === filteredProfiles.filter(p => p.id !== currentUser.id).length ? (
                  <CheckSquare className="w-4 h-4 text-orange-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Chọn tất cả (trừ chính bạn)</span>
              </button>
              <span className="text-slate-500">
                Đã chọn: <strong className="text-orange-600">{selectedIds.length}</strong> nhân sự
              </span>
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-sm shadow-rose-600/30 transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa {selectedIds.length} nhân sự đã chọn</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map(person => {
          const isLocked = person.status === 'locked';
          const isMe = person.id === currentUser.id;
          const isSelected = selectedIds.includes(person.id);
          const heldAssets = assets.filter(a => a.current_holder_id === person.id);
          const userTransfersCount = transfers.filter(
            t => t.from_user_id === person.id || t.to_user_id === person.id
          ).length;

          return (
            <div
              key={person.id}
              className={`bg-white border rounded-2xl p-5 transition flex flex-col justify-between gap-4 shadow-sm hover:shadow-md ${
                isSelected
                  ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10'
                  : isLocked 
                  ? 'border-slate-200 opacity-65 bg-slate-50/60' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                {/* Header user badge with checkbox */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Checkbox for batch select */}
                    {canManageUsers && !isMe ? (
                      <button
                        onClick={() => handleToggleSelect(person.id)}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        title="Chọn để xóa"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-orange-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    ) : null}

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={person.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={person.full_name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                        <span>{person.full_name}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-orange-100 text-orange-700 font-bold rounded">
                            Bạn
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          person.role === 'admin' 
                            ? 'bg-rose-100 text-rose-700'
                            : person.role === 'manager'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {person.role === 'admin' ? 'Admin' : person.role === 'manager' ? 'Quản lý' : 'Nhân sự'}
                        </span>

                        {isLocked ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Đã khóa
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                            🟢 Đang làm việc
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact info & Password status */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{person.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{person.phone || 'Chưa cập nhật SĐT'}</span>
                  </div>
                  {canManageUsers && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <KeyRound className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Mật khẩu: <strong className="font-mono text-slate-800">{person.password || (person.role === 'admin' ? 'admin' : '123456')}</strong></span>
                    </div>
                  )}
                </div>

                {/* Equipment & History statistics */}
                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-xs border border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Đang giữ:</span>
                    <strong className={heldAssets.length > 0 ? 'text-amber-800 font-bold' : 'text-slate-600'}>
                      {heldAssets.length} thiết bị
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Lịch sử giao dịch:</span>
                    <strong className="text-slate-900 font-bold">{userTransfersCount} lượt</strong>
                  </div>
                </div>

                {heldAssets.length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Đang cầm: </span>
                    {heldAssets.map(a => a.code).join(', ')}
                  </div>
                )}
              </div>

              {/* Action Buttons: Xem chi tiết | Sửa | Khóa | Xóa */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingProfile(person)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1 font-semibold"
                    title="Xem chi tiết hồ sơ"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chi tiết</span>
                  </button>

                  {canManageUsers && (
                    <button
                      onClick={() => handleOpenEdit(person)}
                      className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition flex items-center gap-1 font-semibold"
                      title="Chỉnh sửa nhân sự"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      <span>Sửa</span>
                    </button>
                  )}
                </div>

                {canManageUsers && !isMe && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleProfileLock(person.id)}
                      className={`p-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1 ${
                        isLocked
                          ? 'text-emerald-700 hover:bg-emerald-50'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                      title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                    >
                      {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDeleteSingle(person)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa nhân sự này"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW PROFILE DETAIL MODAL */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                Hồ Sơ Nhân Sự
              </h3>
              <button
                onClick={() => setViewingProfile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingProfile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={viewingProfile.full_name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{viewingProfile.full_name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      viewingProfile.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                      viewingProfile.role === 'manager' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {viewingProfile.role}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      viewingProfile.status === 'locked' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {viewingProfile.status === 'locked' ? 'Đã khóa' : 'Đang hoạt động'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Email đăng nhập:</span>
                  <strong className="text-slate-800">{viewingProfile.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                  <strong className="text-slate-800">{viewingProfile.phone || 'Chưa cập nhật'}</strong>
                </div>
                {canManageUsers && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mật khẩu:</span>
                    <strong className="font-mono text-orange-700">{viewingProfile.password || (viewingProfile.role === 'admin' ? 'admin' : '123456')}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày tạo tài khoản:</span>
                  <strong className="text-slate-800 font-mono text-[11px]">
                    {viewingProfile.created_at ? new Date(viewingProfile.created_at).toLocaleString('vi-VN') : 'Mặc định ban đầu'}
                  </strong>
                </div>
              </div>

              {/* Equipment currently held */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-orange-600" />
                  <span>Thiết bị đang giữ ({assets.filter(a => a.current_holder_id === viewingProfile.id).length}):</span>
                </h4>
                <div className="space-y-1">
                  {assets.filter(a => a.current_holder_id === viewingProfile.id).length === 0 ? (
                    <p className="text-slate-400 italic">Hiện không giữ thiết bị nào trong studio.</p>
                  ) : (
                    assets.filter(a => a.current_holder_id === viewingProfile.id).map(a => (
                      <div key={a.id} className="p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-orange-800">{a.code}</span>
                          <span className="text-slate-700 ml-1.5">{a.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{a.location}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingProfile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Chỉnh Sửa Nhân Sự</h3>
              </div>
              <button
                onClick={() => setEditingProfile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Họ và tên nhân sự <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email đăng nhập <span className="text-orange-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mật khẩu đăng nhập
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Vai trò
                  </label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="staff">Nhân sự</option>
                    <option value="manager">Quản lý</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as 'active' | 'locked')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="active">🟢 Đang làm việc</option>
                    <option value="locked">🔴 Khóa tài khoản</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md shadow-amber-600/25 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                Tạo Hồ Sơ Nhân Sự & Mật Khẩu
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Họ và tên nhân sự <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="VD: Lê Hoàng Long (Photographer)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email đăng nhập <span className="text-orange-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="long.photo@matmotmi.vn"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Mật khẩu đăng nhập</span>
                  <span className="text-[11px] text-slate-400 font-normal">Mặc định: 123456</span>
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phân quyền
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="staff">Nhân sự (Mượn trả thiết bị, quét QR kiểm kê)</option>
                  <option value="manager">Quản lý (Duyệt bàn giao, quản lý danh sách thiết bị)</option>
                  <option value="admin">Admin (Toàn quyền quản lý studio & nhân sự)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
