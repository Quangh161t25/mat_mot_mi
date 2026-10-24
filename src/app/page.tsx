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
  MapPin, 
  User, 
  Calendar, 
  ChevronRight,
  ShieldAlert,
  QrCode
} from 'lucide-react';

export default function DashboardPage() {
  const { 
    assets, 
    transfers, 
    currentUser, 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAssetForTransfer, setSelectedAssetForTransfer] = useState<Asset | null>(null);
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
      {/* Top Banner / Welcome & Quick Action (Light & Elegant) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider font-mono">
              Quản Lý Thiết Bị Studio
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Xin chào, {currentUser.full_name.split(' (')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl">
            Nắm bắt tức thì máy ảnh, lens, đèn đang ở đâu, ai giữ đi show và hạn trả.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedAssetForTransfer(null);
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 transition active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Mượn / Trả Thiết Bị</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            <Printer className="w-4 h-4 text-orange-600" />
            <span>In Tem QR</span>
          </button>
        </div>
      </div>

      {/* 4 Trạng thái màu thiết bị - Chạm vào là lọc ngay (Simple & Bright) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 🟢 Xanh: Sẵn sàng sử dụng */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
            statusFilter === 'available' 
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30' 
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              🟢 Sẵn Sàng
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{availableCount}</span>
            <span className="text-xs text-slate-500">/ {assets.length} món</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ở kho, sẵn sàng mang đi chụp</p>
        </div>

        {/* 🟡 Vàng: Đang có người giữ */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'in_use' ? 'all' : 'in_use')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
            statusFilter === 'in_use' 
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30' 
              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              🟡 Đang Giữ
            </span>
            <Boxes className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{inUseCount}</span>
            <span className="text-xs text-slate-500">thiết bị</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Anh em đang cầm đi làm show</p>
        </div>

        {/* 🟠 Cam: Chờ xác nhận giao nhận hoặc trả */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'pending_transfer' ? 'all' : 'pending_transfer')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
            statusFilter === 'pending_transfer' 
              ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/30' 
              : 'bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              🟠 Chờ Xác Nhận
            </span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{pendingCount}</span>
            <span className="text-xs text-slate-500">yêu cầu</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Đang chờ người nhận bấm nhận</p>
        </div>

        {/* 🔴 Đỏ: Quá hạn, hư hỏng, mất */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'alert' ? 'all' : 'alert')}
          className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
            statusFilter === 'alert' 
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/30' 
              : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              🔴 Cần Xử Lý
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{issueAssets.length}</span>
            <span className="text-xs text-rose-700 font-semibold">
              ({overdueAssets.length} quá hạn)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Quá hạn trả hoặc báo hỏng hóc</p>
        </div>
      </div>

      {/* CẢNH BÁO QUÁ HẠN & CHỜ DUYỆT (Super clear alert) */}
      {(overdueAssets.length > 0 || pendingTransfers.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue alert card */}
          {overdueAssets.length > 0 && (
            <div className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>Cảnh Báo: {overdueAssets.length} Thiết Bị Đã Quá Hạn Trả!</span>
                </div>
                <span className="text-[11px] bg-rose-200 text-rose-800 font-mono font-bold px-2 py-0.5 rounded-full">
                  Cần thu hồi
                </span>
              </div>

              <div className="space-y-2">
                {overdueAssets.map(asset => (
                  <div 
                    key={asset.id} 
                    className="p-3 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-3 text-xs shadow-sm"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">{asset.code}</span>
                        <span>{asset.name}</span>
                      </div>
                      <div className="text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-700">
                          <User className="w-3 h-3 text-orange-600" />
                          Người giữ: <strong>{asset.current_holder_name || 'Chưa rõ'}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-rose-700 font-semibold">
                          <Clock className="w-3 h-3 text-rose-600" />
                          Hạn trả: {asset.due_date ? new Date(asset.due_date).toLocaleDateString('vi-VN') : 'Đã quá hạn'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedAssetForIssue(asset)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shrink-0 transition"
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
            <div className="p-4 sm:p-5 bg-orange-50 border border-orange-200 rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                  <Clock className="w-5 h-5 shrink-0 text-orange-600 animate-spin" />
                  <span>{pendingTransfers.length} Giao Dịch Chờ Xác Nhận Hai Bên</span>
                </div>
                <Link
                  href="/transfers"
                  className="text-xs text-orange-700 hover:underline flex items-center gap-1 font-bold"
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
                      className="p-3 bg-white rounded-xl border border-orange-200 flex items-center justify-between gap-3 text-xs shadow-sm"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="font-mono text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">{transfer.asset_code}</span>
                          <span>{transfer.asset_name}</span>
                        </div>
                        <div className="text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                          <span>{transfer.from_user_name} ➔ <strong className="text-emerald-700">{transfer.to_user_name}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedTransferForConfirm(transfer)}
                        className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition ${
                          isRecipient 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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

      {/* DANH SÁCH THIẾT BỊ STUDIO (Clean White Card Layout) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-orange-600" />
              Tất Cả Thiết Bị Studio ({filteredAssets.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Vị trí hiện tại, người phụ trách và ai đang trực tiếp giữ máy
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên máy, lens, mã, người giữ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">🟢 Sẵn sàng</option>
              <option value="in_use">🟡 Đang giữ</option>
              <option value="pending_transfer">🟠 Chờ xác nhận</option>
              <option value="alert">🔴 Cần xử lý / Quá hạn</option>
            </select>
          </div>
        </div>

        {/* Equipment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="bg-white border border-slate-200 hover:border-orange-400/80 rounded-2xl p-4 flex flex-col justify-between gap-3 transition group shadow-sm hover:shadow-md"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.image_url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=150'}
                      alt={asset.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-100 shadow-sm"
                    />
                    <div>
                      <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                        {asset.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 group-hover:text-orange-600 transition line-clamp-1">
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
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">Vị trí: <strong className="text-slate-800">{asset.location}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      Đang giữ: <strong className={asset.current_holder_name ? 'text-amber-800 font-bold' : 'text-emerald-700 font-bold'}>
                        {asset.current_holder_name || 'Kho Studio (Chưa ai giữ)'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Phụ trách: {asset.manager_name || 'Quản lý kho'}</span>
                  </div>

                  {asset.due_date && asset.current_holder_id && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Hạn trả: <strong>{new Date(asset.due_date).toLocaleDateString('vi-VN')}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/assets/${asset.code}`}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  Chi tiết & QR <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedAssetForIssue(asset)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Báo sự cố"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAssetForTransfer(asset);
                      setIsTransferModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700 border border-orange-200 font-bold rounded-lg text-xs transition"
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
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedAssetForTransfer(null);
        }}
        preSelectedAsset={selectedAssetForTransfer}
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
