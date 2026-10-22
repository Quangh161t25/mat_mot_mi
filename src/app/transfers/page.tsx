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
  User, 
  Calendar, 
  Camera, 
  AlertTriangle,
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
    const matchesSearch = 
      tr.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      tr.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      tr.from_user_name.toLowerCase().includes(search.toLowerCase()) ||
      tr.to_user_name.toLowerCase().includes(search.toLowerCase());

    if (activeTab === 'pending') return matchesSearch && tr.status === 'pending';
    if (activeTab === 'for_me') return matchesSearch && tr.status === 'pending' && tr.to_user_id === currentUser.id;
    if (activeTab === 'completed') return matchesSearch && tr.status === 'completed';
    return matchesSearch;
  });

  const pendingCount = transfers.filter(t => t.status === 'pending').length;
  const forMeCount = transfers.filter(t => t.status === 'pending' && trToMe(t)).length;

  function trToMe(t: TransferRecord) {
    return t.to_user_id === currentUser.id;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-orange-600" />
            Quy Trình Mượn – Trả & Bàn Giao Thiết Bị
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Bàn giao trực tiếp giữa anh em studio, chụp ảnh hiện trạng và hai bên cùng xác nhận
          </p>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bàn Giao Mới</span>
        </button>
      </div>

      {/* Rules Banner (Simple & Clear) */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-orange-100 text-orange-700 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-orange-950 text-sm">Quy tắc bảo vệ thiết bị studio:</h4>
            <p className="text-orange-900/80">
              • Người trả <strong className="text-orange-800">không được tự bấm nhận lại</strong>.<br />
              • Thiết bị chỉ chuyển sang trạng thái 🟢 Sẵn sàng khi <strong className="text-emerald-700">người nhận lại vào xác nhận</strong>.
            </p>
          </div>
        </div>

        {forMeCount > 0 && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shrink-0">
            <Clock className="w-4 h-4 animate-spin text-emerald-700" />
            <span>Có {forMeCount} thiết bị đang chờ bạn xác nhận!</span>
          </div>
        )}
      </div>

      {/* Tab Controls & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'pending'
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'for_me'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span>Cần tôi duyệt</span>
              {forMeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 text-[10px] flex items-center justify-center font-bold">
                  {forMeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'completed'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Đã hoàn tất
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Transfers List */}
      {filteredTransfers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <ArrowRightLeft className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Không có giao dịch bàn giao nào trong mục này.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTransfers.map(tr => {
            const isRecipient = currentUser.id === tr.to_user_id;
            const isGiver = currentUser.id === tr.from_user_id;

            return (
              <div
                key={tr.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  tr.status === 'pending'
                    ? isRecipient
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                      : 'border-orange-300 bg-orange-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Asset info & images */}
                <div className="flex items-start gap-3.5 flex-1">
                  {tr.asset_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tr.asset_image}
                      alt={tr.asset_name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm"
                    />
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                        {tr.asset_code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tr.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tr.status === 'pending'
                          ? 'bg-orange-100 text-orange-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {tr.status === 'completed' ? '🟢 Đã hoàn tất' : tr.status === 'pending' ? '🟠 Chờ xác nhận' : '🔴 Từ chối'}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {new Date(tr.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                      {tr.asset_name}
                    </h3>

                    {/* Parties info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-orange-600" />
                        Người giao: <strong className={isGiver ? 'text-orange-700 underline' : 'text-slate-800'}>{tr.from_user_name}</strong>
                      </span>
                      <span className="text-slate-400">➔</span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        Người nhận: <strong className={isRecipient ? 'text-emerald-700 underline font-bold' : 'text-slate-800'}>{tr.to_user_name}</strong>
                      </span>
                    </div>

                    {/* Condition notes & photos */}
                    {tr.giver_notes && (
                      <p className="text-xs text-slate-500 italic line-clamp-1">
                        Hiện trạng giao: &quot;{tr.giver_notes}&quot;
                      </p>
                    )}

                    {tr.giver_photos && tr.giver_photos.length > 0 && (
                      <div className="flex items-center gap-1 pt-1 text-[11px] text-slate-500">
                        <Camera className="w-3.5 h-3.5 text-orange-600" />
                        <span>Có {tr.giver_photos.length} ảnh hiện trạng đính kèm</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action button */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {tr.status === 'pending' ? (
                    isRecipient ? (
                      <button
                        onClick={() => setSelectedTransferForConfirm(tr)}
                        className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tôi xác nhận đã nhận máy</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedTransferForConfirm(tr)}
                        className="w-full md:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                      >
                        <span>Chi tiết / Đang chờ {tr.to_user_name}</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => setSelectedTransferForConfirm(tr)}
                      className="w-full md:w-auto px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold transition"
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
