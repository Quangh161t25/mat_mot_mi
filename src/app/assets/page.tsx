'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from '@/components/StatusBadge';
import { TransferModal } from '@/components/TransferModal';
import { PrintQRModal } from '@/components/PrintQRModal';
import { IssueReportModal } from '@/components/IssueReportModal';
import { Asset, AssetCategory, AssetStatus } from '@/types';
import { 
  Boxes, 
  Plus, 
  Search, 
  Printer, 
  ArrowRightLeft, 
  AlertTriangle, 
  QrCode, 
  MapPin, 
  User, 
  X,
  Check,
  Pencil,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  ShieldCheck,
  Info
} from 'lucide-react';

const CATEGORIES: { id: AssetCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'camera', label: 'Máy ảnh' },
  { id: 'lens', label: 'Lens' },
  { id: 'lighting', label: 'Đèn & Ánh sáng' },
  { id: 'gimbal_tripod', label: 'Gimbal & Chân máy' },
  { id: 'audio', label: 'Ghi âm' },
  { id: 'computer_storage', label: 'Máy tính & Thẻ nhớ' },
  { id: 'accessory', label: 'Phụ kiện' },
];

export default function AssetsPage() {
  const { 
    assets, 
    profiles, 
    canViewAssets,
    canCreateAssets,
    canEditAssets,
    canDeleteAssets,
    canCreateTransfers,
    addAsset, 
    updateAsset, 
    deleteAsset, 
    batchDeleteAssets 
  } = useApp();

  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Selection for Batch Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedAssetForTransfer, setSelectedAssetForTransfer] = useState<Asset | null>(null);
  const [selectedAssetForIssue, setSelectedAssetForIssue] = useState<Asset | null>(null);
  
  // Detail & Edit Modals
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // New Asset form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<AssetCategory>('camera');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newLocation, setNewLocation] = useState('Kho Studio Tầng 1');
  const [newManagerId, setNewManagerId] = useState(profiles[0]?.id || '');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit Asset form state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<AssetCategory>('camera');
  const [editModel, setEditModel] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [editStatus, setEditStatus] = useState<AssetStatus>('available');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Filtering
  const filteredAssets = assets.filter(item => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesStatus = status === 'all' || item.status === status;
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      (item.current_holder_name && item.current_holder_name.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    addAsset({
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      model: newModel.trim(),
      serial_number: newSerial.trim(),
      location: newLocation.trim(),
      image_url: newImageUrl.trim() || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600',
      manager_id: newManagerId || profiles[0]?.id || '',
      current_holder_id: null,
      status: 'available',
      due_date: null,
      notes: newNotes.trim(),
    });

    setIsAddModalOpen(false);
    setNewCode('');
    setNewName('');
    setNewModel('');
    setNewSerial('');
    setNewNotes('');
    setNewImageUrl('');
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditCategory(asset.category);
    setEditModel(asset.model || '');
    setEditSerial(asset.serial_number || '');
    setEditLocation(asset.location);
    setEditManagerId(asset.manager_id);
    setEditStatus(asset.status);
    setEditImageUrl(asset.image_url);
    setEditNotes(asset.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    updateAsset(editingAsset.id, {
      name: editName.trim(),
      category: editCategory,
      model: editModel.trim(),
      serial_number: editSerial.trim(),
      location: editLocation.trim(),
      manager_id: editManagerId,
      status: editStatus,
      image_url: editImageUrl.trim() || editingAsset.image_url,
      notes: editNotes.trim(),
    });

    setEditingAsset(null);
  };

  const handleDeleteSingle = (asset: Asset) => {
    if (confirm(`Bạn có chắc chắn muốn XÓA thiết bị "${asset.name}" (${asset.code}) khỏi hệ thống và Google Sheets?`)) {
      deleteAsset(asset.id);
      setSelectedIds(prev => prev.filter(id => id !== asset.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map(a => a.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn XÓA ${selectedIds.length} thiết bị đã chọn khỏi hệ thống và Google Sheets?`)) {
      batchDeleteAssets(selectedIds);
      setSelectedIds([]);
    }
  };

  if (!canViewAssets) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Không có quyền xem thiết bị</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Tài khoản của bạn chưa được cấp quyền Xem mô-đun Thiết Bị. Vui lòng liên hệ Admin để được phân quyền.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition"
        >
          <span>Về Bảng Điều Khiển</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-orange-600" />
            Danh Sách Thiết Bị Mắt Một Mí Media
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý máy ảnh, lens, đèn, phụ kiện với mã QR, xem chi tiết, chỉnh sửa và xóa thiết bị
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-orange-600" />
            <span>In Tem QR</span>
          </button>

          {canCreateAssets && (
            <button
              onClick={() => {
                const num = assets.length + 1;
                setNewCode(`MMM-EQ-${String(num).padStart(3, '0')}`);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Thiết Bị</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                category === cat.id
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Status select */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên máy, lens, mã tài sản (MMM-CAM-001), người giữ, vị trí..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">🟢 Sẵn sàng sử dụng</option>
              <option value="in_use">🟡 Đang có người giữ</option>
              <option value="pending_transfer">🟠 Chờ xác nhận giao/trả</option>
              <option value="alert">🔴 Quá hạn / Hư hỏng / Mất</option>
            </select>
          </div>
        </div>

        {/* Multi-select Batch Actions Bar */}
        {canDeleteAssets && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
              >
                {selectedIds.length > 0 && selectedIds.length === filteredAssets.length ? (
                  <CheckSquare className="w-4 h-4 text-orange-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>{selectedIds.length === filteredAssets.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
              </button>
              <span className="text-slate-500">
                Đã chọn: <strong className="text-orange-600">{selectedIds.length}</strong> / {filteredAssets.length} thiết bị
              </span>
            </div>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-sm shadow-rose-600/30 transition active:scale-95 animate-in fade-in"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa {selectedIds.length} thiết bị đã chọn</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of Equipment */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Không tìm thấy thiết bị nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {filteredAssets.map(asset => {
            const isSelected = selectedIds.includes(asset.id);
            return (
              <React.Fragment key={asset.id}>
              <article className={`md:hidden min-w-0 flex flex-col bg-white border rounded-2xl overflow-hidden shadow-sm ${isSelected ? 'border-orange-500 ring-2 ring-orange-100' : 'border-slate-200'}`}>
                <div className="relative bg-slate-100">
                  <button type="button" aria-label={`Xem thiết bị ${asset.name}`} onClick={() => setViewingAsset(asset)} className="block w-full aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.image_url} alt={asset.name} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                  {canDeleteAssets && <button type="button" aria-label={`Chọn ${asset.name}`} aria-pressed={isSelected} onClick={() => handleToggleSelect(asset.id)} className="absolute top-1 left-1 w-11 h-11 flex items-center justify-center rounded-xl bg-white/95 border border-slate-200">{isSelected ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5 text-slate-400" />}</button>}
                </div>
                <div className="p-2.5 flex flex-1 flex-col gap-2">
                  <span className="font-mono text-[10px] font-bold text-orange-700 break-all">{asset.code}</span>
                  <button type="button" onClick={() => setViewingAsset(asset)} className="text-left text-sm leading-5 font-bold text-slate-900 line-clamp-2">{asset.name}</button>
                  <span className={`self-start rounded-lg px-2 py-1 text-[11px] font-semibold ${asset.status === 'available' ? 'bg-emerald-50 text-emerald-700' : asset.status === 'in_use' ? 'bg-amber-50 text-amber-800' : asset.status === 'pending_transfer' ? 'bg-orange-50 text-orange-700' : 'bg-rose-50 text-rose-700'}`}>{asset.status === 'available' ? 'Sẵn sàng' : asset.status === 'in_use' ? 'Đang sử dụng' : asset.status === 'pending_transfer' ? 'Chờ xác nhận' : 'Cần xử lý'}</span>
                  <div className="space-y-1.5 text-xs text-slate-600 break-words">
                    <p className="flex items-start gap-1"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="line-clamp-2">{asset.location}</span></p>
                    <p className="flex items-start gap-1"><User className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span className="line-clamp-2">{asset.current_holder_name || 'Kho Studio'}</span></p>
                  </div>
                  <div className="mt-auto pt-2 border-t border-slate-100 space-y-1">
                    {canCreateTransfers && <button type="button" onClick={() => { setSelectedAssetForTransfer(asset); setIsTransferModalOpen(true); }} className="w-full flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-700"><ArrowRightLeft className="w-4 h-4 shrink-0" />Bàn giao</button>}
                    <details>
                      <summary className="min-h-11 flex items-center justify-center cursor-pointer text-xs font-semibold text-slate-600 rounded-xl bg-slate-50">Thao tác ▾</summary>
                      <div className="grid grid-cols-1 gap-1 pt-1">
                        <button type="button" onClick={() => setViewingAsset(asset)} className="text-left px-2 text-xs text-blue-700">Xem chi tiết</button>
                        {canEditAssets && <button type="button" onClick={() => handleOpenEdit(asset)} className="text-left px-2 text-xs text-slate-700">Sửa thiết bị</button>}
                        <button type="button" onClick={() => setSelectedAssetForIssue(asset)} className="text-left px-2 text-xs text-amber-700">Báo sự cố</button>
                        {canDeleteAssets && <button type="button" onClick={() => handleDeleteSingle(asset)} className="text-left px-2 text-xs text-rose-700">Xóa thiết bị</button>}
                      </div>
                    </details>
                  </div>
                </div>
              </article>
              <div
                key={asset.id}
                className={`min-w-0 bg-white border rounded-2xl overflow-hidden hidden md:flex flex-col justify-between transition group shadow-sm hover:shadow-md ${
                  isSelected ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10' : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                {/* Asset Image & Badge Banner */}
                <div className="relative aspect-[2/1] sm:aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.image_url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />

                  {/* Selection Checkbox */}
                  {canDeleteAssets && (
                    <button
                      onClick={() => handleToggleSelect(asset.id)}
                      className="absolute top-2.5 left-2.5 z-10 p-1 rounded-lg bg-white/90 shadow-md border border-slate-200 hover:scale-110 transition text-slate-700"
                      title="Chọn để xóa hàng loạt"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  )}

                  <div className={`absolute top-2.5 ${canDeleteAssets ? 'left-11' : 'left-2.5'}`}>
                    <span className="font-mono text-xs font-black bg-white/95 text-orange-700 px-2.5 py-1 rounded-lg shadow-sm border border-orange-200">
                      {asset.code}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={asset.status} alertReason={asset.alert_reason} size="sm" />
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-orange-600 transition line-clamp-1">
                      {asset.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      Model: {asset.model || 'Chưa cập nhật'} | S/N: {asset.serial_number || 'N/A'}
                    </p>
                  </div>

                  {/* Key Roles & Location */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" /> Vị trí:
                      </span>
                      <strong className="text-slate-800 truncate max-w-[160px]">{asset.location}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-600" /> Người đang giữ:
                      </span>
                      <strong className={asset.current_holder_name ? 'text-amber-800 font-bold' : 'text-emerald-700 font-bold'}>
                        {asset.current_holder_name || 'Kho Studio'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500">Phụ trách:</span>
                      <span className="text-slate-700">{asset.manager_name || 'Quản lý kho'}</span>
                    </div>
                  </div>

                  {/* Action Buttons: Xem chi tiết | Sửa | Xóa | Bàn giao */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      {/* Xem chi tiết */}
                      <button
                        onClick={() => setViewingAsset(asset)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                        title="Xem chi tiết thiết bị"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>Chi tiết</span>
                      </button>

                      {/* Sửa */}
                      {canEditAssets && (
                        <button
                          onClick={() => handleOpenEdit(asset)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                          title="Chỉnh sửa thông tin thiết bị"
                        >
                          <Pencil className="w-4 h-4 text-amber-600" />
                          <span>Sửa</span>
                        </button>
                      )}

                      {/* Xóa */}
                      {canDeleteAssets && (
                        <button
                          onClick={() => handleDeleteSingle(asset)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                          title="Xóa thiết bị này"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedAssetForIssue(asset)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Báo hỏng / Báo sự cố"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>

                      {canCreateTransfers && (
                        <button
                          onClick={() => {
                            setSelectedAssetForTransfer(asset);
                            setIsTransferModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-600 hover:text-white text-orange-700 text-xs font-bold rounded-xl transition"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Bàn giao</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {viewingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                  {viewingAsset.code}
                </span>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Chi Tiết Thiết Bị</h3>
              </div>
              <button
                onClick={() => setViewingAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Image banner */}
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingAsset.image_url}
                  alt={viewingAsset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={viewingAsset.status} alertReason={viewingAsset.alert_reason} size="sm" />
                </div>
              </div>

              <div>
                <h2 className="text-base font-black text-slate-900">{viewingAsset.name}</h2>
                <p className="text-slate-500 font-mono mt-0.5">
                  Phân loại: <strong className="text-slate-700 uppercase">{viewingAsset.category}</strong>
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Model:</span>
                  <strong className="text-slate-800">{viewingAsset.model || 'Chưa cập nhật'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số Serial (S/N):</span>
                  <strong className="font-mono text-slate-800">{viewingAsset.serial_number || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Vị trí hiện tại:</span>
                  <strong className="text-blue-700">{viewingAsset.location}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người đang cầm:</span>
                  <strong className={viewingAsset.current_holder_name ? 'text-amber-800' : 'text-emerald-700'}>
                    {viewingAsset.current_holder_name || 'Kho Studio (Chưa ai mượn)'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người phụ trách quản lý:</span>
                  <strong className="text-slate-800">{viewingAsset.manager_name || 'Quản lý kho'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Cập nhật lần cuối:</span>
                  <strong className="text-slate-800 font-mono text-[11px]">
                    {new Date(viewingAsset.updated_at).toLocaleString('vi-VN')}
                  </strong>
                </div>
              </div>

              {/* Notes */}
              {viewingAsset.notes && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Ghi chú phụ kiện kèm theo:</span>
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-950">
                    {viewingAsset.notes}
                  </div>
                </div>
              )}

              {/* QR and History Action link */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <Link
                  href={`/assets/${viewingAsset.code}`}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition text-xs"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Mở trang QR & Lịch sử chi tiết</span>
                </Link>

                <button
                  onClick={() => {
                    const toEdit = viewingAsset;
                    setViewingAsset(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition text-xs"
                >
                  <Pencil className="w-4 h-4 text-amber-600" />
                  <span>Sửa thiết bị này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ASSET MODAL */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Sửa Thiết Bị: {editingAsset.code}
                </h3>
              </div>
              <button
                onClick={() => setEditingAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên thiết bị <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Danh mục
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as AssetCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="camera">Máy ảnh</option>
                    <option value="lens">Lens (Ống kính)</option>
                    <option value="lighting">Đèn & Ánh sáng</option>
                    <option value="gimbal_tripod">Gimbal & Chân máy</option>
                    <option value="audio">Micro & Âm thanh</option>
                    <option value="computer_storage">Máy tính & Thẻ nhớ</option>
                    <option value="accessory">Phụ kiện khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Trạng thái hiện tại
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as AssetStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="available">🟢 Sẵn sàng</option>
                    <option value="in_use">🟡 Đang sử dụng</option>
                    <option value="pending_transfer">🟠 Chờ xác nhận</option>
                    <option value="alert">🔴 Cảnh báo sự cố</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Model</label>
                  <input
                    type="text"
                    value={editModel}
                    onChange={e => setEditModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Số Serial (S/N)</label>
                  <input
                    type="text"
                    value={editSerial}
                    onChange={e => setEditSerial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vị trí</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Người phụ trách</label>
                  <select
                    value={editManagerId}
                    onChange={e => setEditManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">URL ảnh</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={e => setEditImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi chú phụ kiện</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/25 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW ASSET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-600" />
                Thêm Thiết Bị Mới Vào Studio
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mã tài sản <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="VD: MMM-CAM-004"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono uppercase focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Danh mục <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as AssetCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="camera">Máy ảnh</option>
                    <option value="lens">Lens (Ống kính)</option>
                    <option value="lighting">Đèn & Ánh sáng</option>
                    <option value="gimbal_tripod">Gimbal & Chân máy</option>
                    <option value="audio">Micro & Âm thanh</option>
                    <option value="computer_storage">Máy tính & Thẻ nhớ</option>
                    <option value="accessory">Phụ kiện khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên thiết bị <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="VD: Body Sony Alpha 7 IV hoặc Lens Sony 24-70 GM II"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    placeholder="VD: ILCE-7M4"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Số Serial (S/N)
                  </label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={e => setNewSerial(e.target.value)}
                    placeholder="VD: SN-884920"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Vị trí cất giữ ban đầu
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="VD: Tủ chống ẩm A1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Người phụ trách chính
                  </label>
                  <select
                    value={newManagerId}
                    onChange={e => setNewManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Đường dẫn ảnh thiết bị (URL)
                </label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="https://... (hoặc để trống dùng ảnh mặc định)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú phụ kiện kèm theo
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="VD: Kèm 2 pin FZ100, sạc đôi, dây đeo, thẻ nhớ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
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
                  Lưu thiết bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALS */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedAssetForTransfer(null);
        }}
        preSelectedAsset={selectedAssetForTransfer}
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
