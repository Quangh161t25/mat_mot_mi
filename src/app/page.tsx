'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from '@/components/StatusBadge';
import { TransferModal } from '@/components/TransferModal';
import { ConfirmTransferModal } from '@/components/ConfirmTransferModal';
import { PrintQRModal } from '@/components/PrintQRModal';
import { IssueReportModal } from '@/components/IssueReportModal';
import { TransferRecord, Asset } from '@/types';
import { 
  Boxes, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRightLeft, 
  Users, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Calendar, 
  ChevronRight,
  ShieldAlert,
  Flame,
  Camera
} from 'lucide-react';

export default function DashboardPage() {
  const { 
    assets, 
    profiles, 
    transfers, 
    currentUser, 
    canManageEquipment 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedTransferForConfirm, setSelectedTransferForConfirm] = useState<TransferRecord | null>(null);
  const [selectedAssetForIssue, setSelectedAssetForIssue] = useState<Asset | null>(null);

  // Status Metrics
  const availableCount = assets.filter(a => a.status === 'available').length;
  const inUseCount = assets.filter(a => a.status === 'in_use').length;
  const pendingCount = assets.filter(a => a.status === 'pending_transfer').length;
  
  const now = new Date();
  const overdueAssets = assets.filter(a => {
    if (a.status === 'alert' && a.alert_reason === 'overdue') return true;
    if (a.status === 'in_use' && a.due_date && new Date(a.due_date) < now) return true;
    return false;
  });

  const issueAssets = assets.filter(a => a.status === 'alert');
  const pendingTransfers = transfers.filter(t => t.status === 'pending');

  // Filtered Assets list
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.current_holder_name && asset.current_holder_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#131B2E] to-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider font-mono">
              Bảng Điều Khiển Quản Lý
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Chào {currentUser.full_name.split(' (')[0]}, Studio Mắt Một Mí!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Theo dõi chính xác vị trí, ai đang giữ thiết bị đi show và trạng thái bàn giao máy ảnh cưới.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/30 transition active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Mượn / Bàn Giao Thiết Bị</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>In Tem QR</span>
          </button>
        </div>
      </div>

      {/* 4 Trạng thái màu thiết bị (Requirement 5 & 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 🟢 Xanh: Sẵn sàng sử dụng */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'available' 
              ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10' 
              : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              🟢 Sẵn Sàng
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{availableCount}</span>
            <span className="text-xs text-slate-400">/ {assets.length} món</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đang ở kho, sẵn sàng đi show</p>
        </div>

        {/* 🟡 Vàng: Đang có người giữ */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'in_use' ? 'all' : 'in_use')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'in_use' 
              ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10' 
              : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              🟡 Đang Sử Dụng
            </span>
            <Boxes className="w-4 h-4 text-amber-400/60" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{inUseCount}</span>
            <span className="text-xs text-slate-400">thiết bị</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Nhân viên đang cầm đi quay chụp</p>
        </div>

        {/* 🟠 Cam: Chờ xác nhận giao nhận hoặc trả */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'pending_transfer' ? 'all' : 'pending_transfer')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'pending_transfer' 
              ? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/10' 
              : 'bg-slate-900/60 border-slate-800 hover:border-orange-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
              🟠 Chờ Xác Nhận
            </span>
            <Clock className="w-4 h-4 text-orange-400/60" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{pendingCount}</span>
            <span className="text-xs text-slate-400">yêu cầu</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chờ người nhận bấm duyệt</p>
        </div>

        {/* 🔴 Đỏ: Quá hạn, hư hỏng, mất */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'alert' ? 'all' : 'alert')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            statusFilter === 'alert' 
              ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/10' 
              : 'bg-slate-900/60 border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              🔴 Cần Xử Lý
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400/60" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{issueAssets.length}</span>
            <span className="text-xs text-rose-400 font-medium">
              ({overdueAssets.length} quá hạn)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Quá hạn trả, hư hỏng hoặc mất</p>
        </div>
      </div>

      {/* CẢNH BÁO QUÁ HẠN & CHỜ DUYỆT (Urgent Alerts Section) */}
      {(overdueAssets.length > 0 || pendingTransfers.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue alert card */}
          {overdueAssets.length > 0 && (
            <div className="p-4 sm:p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Cảnh Báo: {overdueAssets.length} Thiết Bị Đã Quá Hạn Trả!</span>
                </div>
                <span className="text-[11px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded-full">
                  Cần thu hồi
                </span>
              </div>

              <div className="space-y-2">
                {overdueAssets.map(asset => (
                  <div 
                    key={asset.id} 
                    className="p-3 bg-slate-900/90 rounded-xl border border-rose-500/20 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="font-mono text-rose-400">{asset.code}</span>
                        <span>{asset.name}</span>
                      </div>
                      <div className="text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="w-3 h-3 text-orange-400" />
                          Người giữ: <strong>{asset.current_holder_name || 'Chưa rõ'}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-rose-300">
                          <Clock className="w-3 h-3 text-rose-400" />
                          Hạn trả: {asset.due_date ? new Date(asset.due_date).toLocaleDateString('vi-VN') : 'Đã quá hạn'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedAssetForIssue(asset)}
                      className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg font-medium shrink-0 transition"
                    >
                      Xử lý
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Confirmations card */}
          {pendingTransfers.length > 0 && (
            <div className="p-4 sm:p-5 bg-orange-500/10 border border-orange-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                  <Clock className="w-5 h-5 shrink-0 animate-spin" />
                  <span>{pendingTransfers.length} Giao Dịch Chờ Xác Nhận Hai Bên</span>
                </div>
                <Link
                  href="/transfers"
                  className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2">
                {pendingTransfers.slice(0, 3).map(transfer => {
                  const isRecipient = currentUser.id === transfer.to_user_id;
                  return (
                    <div 
                      key={transfer.id} 
                      className="p-3 bg-slate-900/90 rounded-xl border border-orange-500/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="font-mono text-orange-400">{transfer.asset_code}</span>
                          <span>{transfer.asset_name}</span>
                        </div>
                        <div className="text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>{transfer.from_user_name} ➔ <strong className="text-emerald-400">{transfer.to_user_name}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedTransferForConfirm(transfer)}
                        className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition ${
                          isRecipient 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isRecipient ? 'Xác nhận ngay' : 'Chi tiết'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DANH SÁCH THIẾT BỊ & TÌNH TRẠNG THEO DÕI THỜI GIAN THỰC */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-orange-500" />
              Toàn Bộ Thiết Bị Studio ({filteredAssets.length})
            </h2>
            <p className="text-xs text-slate-400">
              Biết ngay máy ảnh, lens, đèn đang ở đâu, ai đang cầm và người phụ trách
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã, tên, người giữ, vị trí..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">🟢 Sẵn sàng</option>
              <option value="in_use">🟡 Đang sử dụng</option>
              <option value="pending_transfer">🟠 Chờ xác nhận</option>
              <option value="alert">🔴 Sự cố / Quá hạn</option>
            </select>
          </div>
        </div>

        {/* Assets Cards / Table Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-3 transition group shadow-md"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.image_url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=150'}
                      alt={asset.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                    />
                    <div>
                      <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                        {asset.code}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1 group-hover:text-orange-400 transition line-clamp-1">
                        {asset.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <StatusBadge status={asset.status} alertReason={asset.alert_reason} size="sm" />
                </div>

                {/* Location & Holders (Requirement 2 & 6) */}
                <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">Vị trí: <strong className="text-slate-200">{asset.location}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">
                      Đang giữ: <strong className={asset.current_holder_name ? 'text-amber-300 font-semibold' : 'text-emerald-400'}>
                        {asset.current_holder_name || 'Kho Studio (Chưa ai giữ)'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Phụ trách: {asset.manager_name || 'Quản lý kho'}</span>
                  </div>

                  {asset.due_date && asset.current_holder_id && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Hạn trả: {new Date(asset.due_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <Link
                  href={`/assets/${asset.code}`}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  Chi tiết & QR <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedAssetForIssue(asset);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Báo sự cố"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setIsTransferModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    Bàn giao
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODALS */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <ConfirmTransferModal
        isOpen={Boolean(selectedTransferForConfirm)}
        onClose={() => setSelectedTransferForConfirm(null)}
        transfer={selectedTransferForConfirm}
      />

      <PrintQRModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        assets={assets}
      />

      <IssueReportModal
        isOpen={Boolean(selectedAssetForIssue)}
        onClose={() => setSelectedAssetForIssue(null)}
        asset={selectedAssetForIssue}
      />
    </div>
  );
}
