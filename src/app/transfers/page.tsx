'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TransferModal } from '@/components/TransferModal';
import { ConfirmTransferModal } from '@/components/ConfirmTransferModal';
import { TransferRecord } from '@/types';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Calendar, 
  MapPin, 
  Camera, 
  Filter,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function TransfersPage() {
  const { transfers, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'for_me' | 'completed'>('pending');
  const [search, setSearch] = useState('');
  
  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTransferForConfirm, setSelectedTransferForConfirm] = useState<TransferRecord | null>(null);

  // Filter transfers
  const filteredTransfers = transfers.filter(tr => {
    // Search
    const matchesSearch = 
      tr.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      tr.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      tr.from_user_name.toLowerCase().includes(search.toLowerCase()) ||
      tr.to_user_name.toLowerCase().includes(search.toLowerCase());

    // Tab
    if (activeTab === 'pending') return matchesSearch && tr.status === 'pending';
    if (activeTab === 'for_me') return matchesSearch && tr.status === 'pending' && tr.to_user_id === currentUser.id;
    if (activeTab === 'completed') return matchesSearch && tr.status === 'completed';
    return matchesSearch;
  });

  const pendingCount = transfers.filter(t => t.status === 'pending').length;
  const forMeCount = transfers.filter(t => t.status === 'pending' && t.to_user_id === currentUser.id).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-orange-500" />
            Quy Trình Mượn – Trả & Bàn Giao Thiết Bị
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Bàn giao trực tiếp giữa các nhân sự, chụp ảnh hiện trạng và xác nhận 2 bên
          </p>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Yêu Cầu Bàn Giao Mới</span>
        </button>
      </div>

      {/* Rules Banner (Requirement 4) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-white text-sm">Quy tắc bảo vệ thiết bị nghiêm ngặt:</h4>
            <p className="text-slate-400">
              • Người trả <strong className="text-orange-400">không được tự xác nhận</strong> đã nhận lại.<br />
              • Thiết bị chỉ chuyển sang trạng thái 🟢 Sẵn sàng hoặc người giữ mới khi <strong className="text-emerald-400">người nhận lại xác nhận</strong>.
            </p>
          </div>
        </div>

        {forMeCount > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shrink-0">
            <Clock className="w-4 h-4 animate-spin" />
            <span>Có {forMeCount} thiết bị đang chờ bạn xác nhận!</span>
          </div>
        )}
      </div>

      {/* Tab Controls & Search */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'pending'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <span>Chờ xác nhận</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('for_me')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'for_me'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <span>Cần tôi duyệt</span>
              {forMeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                  {forMeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'completed'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Đã hoàn tất
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({transfers.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã, thiết bị, người giao/nhận..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Transfers List */}
      {filteredTransfers.length === 0 ? (
        <div className="text-center py-16 bg-[#131B2E] border border-slate-800 rounded-3xl">
          <ArrowRightLeft className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Không có giao dịch bàn giao nào trong mục này.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTransfers.map(tr => {
            const isRecipient = currentUser.id === tr.to_user_id;
            const isGiver = currentUser.id === tr.from_user_id;

            return (
              <div
                key={tr.id}
                className={`bg-[#131B2E] border rounded-2xl p-4 sm:p-5 transition shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  tr.status === 'pending'
                    ? isRecipient
                      ? 'border-emerald-500/80 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                      : 'border-orange-500/40 bg-orange-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left: Asset info & images */}
                <div className="flex items-start gap-3.5 flex-1">
                  {tr.asset_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tr.asset_image}
                      alt={tr.asset_name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                        {tr.asset_code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tr.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : tr.status === 'pending'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {tr.status === 'completed' ? '🟢 Đã hoàn tất' : tr.status === 'pending' ? '🟠 Chờ xác nhận' : '🔴 Từ chối'}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {new Date(tr.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm sm:text-base truncate">
                      {tr.asset_name}
                    </h3>

                    {/* Parties info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-orange-400" />
                        Người giao: <strong className={isGiver ? 'text-orange-400 underline' : 'text-white'}>{tr.from_user_name}</strong>
                      </span>
                      <span className="text-slate-500">➔</span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        Người nhận: <strong className={isRecipient ? 'text-emerald-400 underline font-bold' : 'text-white'}>{tr.to_user_name}</strong>
                      </span>
                    </div>

                    {/* Condition notes & photos */}
                    {tr.giver_notes && (
                      <p className="text-xs text-slate-400 italic line-clamp-1">
                        Hiện trạng giao: &quot;{tr.giver_notes}&quot;
                      </p>
                    )}

                    {tr.giver_photos && tr.giver_photos.length > 0 && (
                      <div className="flex items-center gap-1 pt-1 text-[11px] text-slate-400">
                        <Camera className="w-3.5 h-3.5 text-orange-400" />
                        <span>Có {tr.giver_photos.length} ảnh hiện trạng đính kèm</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action button */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {tr.status === 'pending' ? (
                    isRecipient ? (
                      <button
                        onClick={() => setSelectedTransferForConfirm(tr)}
                        className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tôi xác nhận đã nhận máy</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedTransferForConfirm(tr)}
                        className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                      >
                        <span>Chi tiết / Đang chờ {tr.to_user_name}</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => setSelectedTransferForConfirm(tr)}
                      className="w-full md:w-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition"
                    >
                      Xem lại biên bản
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
