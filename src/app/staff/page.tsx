'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
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
  X
} from 'lucide-react';

export default function StaffPage() {
  const { profiles, assets, transfers, canManageUsers, addProfile, updateProfile, toggleProfileLock, currentUser } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New staff form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

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
      avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=150&auto=format&fit=crop&q=80`,
    });

    setIsAddModalOpen(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('staff');
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
            Phân quyền Admin, Quản lý, Nhân sự. Không chia team cố định. Khóa tài khoản khi nghỉ việc nhưng lưu vĩnh viễn lịch sử.
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Nhân Sự</span>
          </button>
        )}
      </div>

      {/* Flexible Team & Policy Notice */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3 text-xs shadow-sm">
        <div className="p-2 bg-orange-100 text-orange-700 rounded-xl shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-orange-950 text-sm">Chính sách nhân sự studio cưới:</h4>
          <p className="text-orange-900/80">
            • <strong>Linh hoạt không chia team cố định:</strong> Mọi nhân sự có thể chủ động bàn giao máy ảnh, lens trực tiếp cho nhau theo lịch show.<br />
            • <strong>Bảo toàn dữ liệu:</strong> Khi khóa tài khoản nhân sự nghỉ việc, toàn bộ lịch sử bàn giao, ảnh hiện trạng trước đây vẫn được giữ nguyên để đối soát.
          </p>
        </div>
      </div>

      {/* Search & Role Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
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

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map(person => {
          const isLocked = person.status === 'locked';
          const heldAssets = assets.filter(a => a.current_holder_id === person.id);
          const userTransfersCount = transfers.filter(
            t => t.from_user_id === person.id || t.to_user_id === person.id
          ).length;

          return (
            <div
              key={person.id}
              className={`bg-white border rounded-2xl p-5 transition flex flex-col justify-between gap-4 shadow-sm hover:shadow-md ${
                isLocked 
                  ? 'border-slate-200 opacity-65 bg-slate-50/60' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                {/* Header user badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={person.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={person.full_name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {person.full_name}
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
                            <Lock className="w-2.5 h-2.5" /> Đã nghỉ việc
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

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{person.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{person.phone || 'Chưa cập nhật SĐT'}</span>
                  </div>
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

              {/* Actions: Change role & Lock account */}
              {canManageUsers && currentUser.id !== person.id && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <select
                    value={person.role}
                    onChange={e => updateProfile(person.id, { role: e.target.value as UserRole })}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="staff">Nhân sự</option>
                    <option value="manager">Quản lý</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => {
                      if (confirm(
                        isLocked 
                          ? `Mở khóa lại tài khoản cho ${person.full_name}?` 
                          : `Bạn có chắc muốn KHÓA tài khoản của ${person.full_name} (nhân sự nghỉ việc)? Lịch sử mượn trả vẫn được lưu trữ nguyên vẹn.`
                      )) {
                        toggleProfileLock(person.id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      isLocked
                        ? 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-emerald-700'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Mở khóa lại</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Khóa tài khoản</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                Tạo Hồ Sơ Nhân Sự Mới
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
