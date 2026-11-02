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
  Pencil,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  ShieldCheck,
  X,
  Check,
  MapPin,
  Lock
} from 'lucide-react';

export default function TransfersPage() {
  const { 
    transfers, 
    currentUser, 
    canManageEquipment, 
    updateTransfer, 
    deleteTransfer, 
    batchDeleteTransfers 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'for_me' | 'completed'>('pending');
  const [search, setSearch] = useState('');
  
  // Selection for Batch Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTransferForConfirm, setSelectedTransferForConfirm] = useState<TransferRecord | null>(null);
  const [viewingTransfer, setViewingTransfer] = useState<TransferRecord | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<TransferRecord | null>(null);

  // Edit Transfer form state
  const [editGiverNotes, setEditGiverNotes] = useState('');
  const [editLocationAfter, setEditLocationAfter] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // PHÂN QUYỀN: Nhân viên thường CHỈ xem các giao dịch liên quan đến chính mình
  const isStaffOnly = currentUser?.role === 'staff';
  const scopedTransfers = isStaffOnly
    ? transfers.filter(tr => tr.to_user_id === currentUser.id || tr.from_user_id === currentUser.id)
    : transfers;

  // Filter transfers
  const filteredTransfers = scopedTransfers.filter(tr => {
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

  const pendingCount = scopedTransfers.filter(t => t.status === 'pending').length;
  const forMeCount = scopedTransfers.filter(t => t.status === 'pending' && t.to_user_id === currentUser.id).length;

  const handleOpenEdit = (tr: TransferRecord) => {
    setEditingTransfer(tr);
    setEditGiverNotes(tr.giver_notes || '');
    setEditLocationAfter(tr.location_after || '');
    setEditDueDate(tr.due_date || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;

    updateTransfer(editingTransfer.id, {
      giver_notes: editGiverNotes.trim(),
      location_after: editLocationAfter.trim(),
      due_date: editDueDate || null,
    });

    setEditingTransfer(null);
  };

  const handleDeleteSingle = (tr: TransferRecord) => {
    if (confirm(`Bạn có chắc chắn muốn XÓA giao dịch bàn giao thiết bị "${tr.asset_name}" (${tr.asset_code})?`)) {
      deleteTransfer(tr.id);
      setSelectedIds(prev => prev.filter(id => id !== tr.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTransfers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransfers.map(t => t.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn có chắc muốn XÓA ${selectedIds.length} giao dịch đã chọn khỏi hệ thống và Google Sheets?`)) {
      batchDeleteTransfers(selectedIds);
      setSelectedIds([]);
    }
  };

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
            Bàn giao trực tiếp, xem chi tiết biên bản, chỉnh sửa, xóa và phân quyền xác nhận đúng người nhận
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
            <h4 className="font-bold text-orange-950 text-sm">Phân quyền & Quy tắc bàn giao:</h4>
            <p className="text-orange-900/80">
              {isStaffOnly ? (
                <span>
                  • <strong>Chế độ Nhân sự:</strong> Bạn chỉ nhìn thấy và xác nhận các giao dịch liên quan trực tiếp đến bạn ({currentUser.full_name}).<br />
                  • Chỉ người nhận mới có quyền bấm xác nhận nhận máy.
                </span>
              ) : (
                <span>
                  • <strong>Chế độ Quản trị:</strong> Admin / Quản lý có thể xem toàn bộ giao dịch của studio và hỗ trợ duyệt giao dịch nếu cần.<br />
                  • Thiết bị chỉ chuyển sang 🟢 Sẵn sàng khi người nhận xác nhận kiểm tra máy.
                </span>
              )}
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
              Tất cả ({scopedTransfers.length})
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

        {/* Multi-select Batch Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              {selectedIds.length > 0 && selectedIds.length === filteredTransfers.length ? (
                <CheckSquare className="w-4 h-4 text-orange-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>{selectedIds.length === filteredTransfers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
            </button>
            <span className="text-slate-500">
              Đã chọn: <strong className="text-orange-600">{selectedIds.length}</strong> / {filteredTransfers.length} giao dịch
            </span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-sm shadow-rose-600/30 transition active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa {selectedIds.length} giao dịch đã chọn</span>
            </button>
          )}
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
            const canConfirm = isRecipient || canManageEquipment;
            const isSelected = selectedIds.includes(tr.id);

            return (
              <div
                key={tr.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected 
                    ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10'
                    : tr.status === 'pending'
                    ? isRecipient
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                      : 'border-orange-300 bg-orange-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Checkbox + Asset info & images */}
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Select Checkbox */}
                  <button
                    onClick={() => handleToggleSelect(tr.id)}
                    className="mt-1 p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                    title="Chọn để xóa"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-orange-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

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
                        Người giao: <strong className={isGiver ? 'text-orange-700 underline font-bold' : 'text-slate-800'}>{tr.from_user_name}</strong>
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
                        <span>Có {tr.giver_photos.length} ảnh hiện trạng bàn giao</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions: Xem chi tiết | Sửa | Xóa | Xác nhận */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1 justify-end">
                    {/* Xem chi tiết */}
                    <button
                      onClick={() => setViewingTransfer(tr)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                      title="Xem chi tiết biên bản"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="hidden lg:inline">Chi tiết</span>
                    </button>

                    {/* Sửa */}
                    <button
                      onClick={() => handleOpenEdit(tr)}
                      className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                      title="Chỉnh sửa giao dịch"
                    >
                      <Pencil className="w-4 h-4 text-amber-600" />
                      <span className="hidden lg:inline">Sửa</span>
                    </button>

                    {/* Xóa */}
                    <button
                      onClick={() => handleDeleteSingle(tr)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                      title="Xóa giao dịch này"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span className="hidden lg:inline">Xóa</span>
                    </button>
                  </div>

                  {/* Confirm or Status button */}
                  {tr.status === 'pending' ? (
                    canConfirm ? (
                      <button
                        onClick={() => setSelectedTransferForConfirm(tr)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tôi xác nhận nhận máy</span>
                      </button>
                    ) : (
                      <div className="px-3.5 py-2 bg-slate-100 text-slate-500 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chờ {tr.to_user_name} xác nhận</span>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => setSelectedTransferForConfirm(tr)}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold transition text-center"
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

      {/* VIEW TRANSFER DETAIL MODAL */}
      {viewingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Chi Tiết Biên Bản Bàn Giao</h3>
              </div>
              <button
                onClick={() => setViewingTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                {viewingTransfer.asset_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewingTransfer.asset_image}
                    alt={viewingTransfer.asset_name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                  />
                )}
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    {viewingTransfer.asset_code}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{viewingTransfer.asset_name}</h4>
                </div>
              </div>

              {/* Status and Parties */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Trạng thái:</span>
                  <strong className={viewingTransfer.status === 'completed' ? 'text-emerald-700 font-bold' : 'text-orange-700 font-bold'}>
                    {viewingTransfer.status === 'completed' ? '🟢 Đã hoàn tất' : viewingTransfer.status === 'pending' ? '🟠 Chờ xác nhận' : '🔴 Từ chối'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thời gian tạo:</span>
                  <strong className="text-slate-800">{new Date(viewingTransfer.created_at).toLocaleString('vi-VN')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người giao:</span>
                  <strong className="text-orange-800">{viewingTransfer.from_user_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người nhận:</span>
                  <strong className="text-emerald-800">{viewingTransfer.to_user_name}</strong>
                </div>
                {viewingTransfer.confirmed_at && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Thời gian bên nhận xác nhận:</span>
                    <strong className="text-emerald-700">{new Date(viewingTransfer.confirmed_at).toLocaleString('vi-VN')}</strong>
                  </div>
                )}
                {viewingTransfer.due_date && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hạn trả dự kiến:</span>
                    <strong className="text-slate-800">{viewingTransfer.due_date}</strong>
                  </div>
                )}
                {viewingTransfer.location_after && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Vị trí sau bàn giao:</span>
                    <strong className="text-slate-800">{viewingTransfer.location_after}</strong>
                  </div>
                )}
              </div>

              {/* Giver Notes & Photos */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Hiện trạng bên giao ghi chú:</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                  {viewingTransfer.giver_notes || 'Không có ghi chú thêm'}
                </div>
                {viewingTransfer.giver_photos && viewingTransfer.giver_photos.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {viewingTransfer.giver_photos.map((photo, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={photo}
                        alt={`Ảnh giao #${i + 1}`}
                        className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Receiver Notes & Photos */}
              {viewingTransfer.status === 'completed' && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Bên nhận ghi chú phản hồi:</h4>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                    {viewingTransfer.receiver_notes || 'Đã nhận đầy đủ, máy hoạt động bình thường.'}
                  </div>
                  {viewingTransfer.receiver_photos && viewingTransfer.receiver_photos.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {viewingTransfer.receiver_photos.map((photo, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={photo}
                          alt={`Ảnh nhận #${i + 1}`}
                          className="w-full aspect-square object-cover rounded-xl border border-slate-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingTransfer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TRANSFER MODAL */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Sửa Thông Tin Bàn Giao</h3>
              </div>
              <button
                onClick={() => setEditingTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-mono text-xs font-bold text-orange-700">{editingTransfer.asset_code}</span>
                <div className="font-bold text-slate-900 mt-0.5">{editingTransfer.asset_name}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {editingTransfer.from_user_name} ➔ {editingTransfer.to_user_name}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vị trí sau bàn giao
                </label>
                <input
                  type="text"
                  value={editLocationAfter}
                  onChange={e => setEditLocationAfter(e.target.value)}
                  placeholder="VD: Kho Studio Tầng 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Hạn trả dự kiến
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú hiện trạng máy
                </label>
                <textarea
                  rows={3}
                  value={editGiverNotes}
                  onChange={e => setEditGiverNotes(e.target.value)}
                  placeholder="Ghi chú máy, phụ kiện..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTransfer(null)}
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
