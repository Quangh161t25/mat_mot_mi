'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from '@/components/StatusBadge';
import { TransferModal } from '@/components/TransferModal';
import { PrintQRModal } from '@/components/PrintQRModal';
import { IssueReportModal } from '@/components/IssueReportModal';
import { Asset, AssetCategory } from '@/types';
import { 
  Boxes, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  ArrowRightLeft, 
  AlertTriangle, 
  QrCode, 
  MapPin, 
  User, 
  Camera, 
  SlidersHorizontal,
  ChevronRight,
  X,
  Check
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
  const { assets, profiles, canManageEquipment, addAsset } = useApp();

  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedAssetForTransfer, setSelectedAssetForTransfer] = useState<Asset | null>(null);
  const [selectedAssetForIssue, setSelectedAssetForIssue] = useState<Asset | null>(null);

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
    // Reset form
    setNewCode('');
    setNewName('');
    setNewModel('');
    setNewSerial('');
    setNewNotes('');
    setNewImageUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-orange-500" />
            Danh Sách Thiết Bị Mắt Một Mí Media
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Mỗi thiết bị có mã riêng, QR code, hình ảnh và phân biệt rõ người phụ trách vs người đang giữ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>In Tem QR</span>
          </button>

          {canManageEquipment && (
            <button
              onClick={() => {
                // Auto generate code recommendation
                const num = assets.length + 1;
                setNewCode(`MMM-EQ-${String(num).padStart(3, '0')}`);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Thiết Bị Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                category === cat.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Status select */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên máy, lens, mã tài sản (MMM-CAM-001), người giữ, vị trí..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Tất cả trạng thái (4 màu)</option>
              <option value="available">🟢 Sẵn sàng sử dụng</option>
              <option value="in_use">🟡 Đang có người giữ</option>
              <option value="pending_transfer">🟠 Chờ xác nhận giao/trả</option>
              <option value="alert">🔴 Quá hạn / Hư hỏng / Mất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Equipment */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-[#131B2E] border border-slate-800 rounded-3xl">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Không tìm thấy thiết bị nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="bg-[#131B2E] border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between transition group shadow-lg"
            >
              {/* Asset Image & Badge Banner */}
              <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.image_url}
                  alt={asset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="font-mono text-xs font-black bg-black/80 text-orange-400 px-2.5 py-1 rounded-lg backdrop-blur-md border border-orange-500/30">
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
                  <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition line-clamp-1">
                    {asset.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Model: {asset.model || 'Chưa cập nhật'} | S/N: {asset.serial_number || 'N/A'}
                  </p>
                </div>

                {/* Key Roles & Location (Requirement 2) */}
                <div className="p-3 bg-slate-900/60 rounded-xl space-y-1.5 text-xs border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" /> Vị trí:
                    </span>
                    <strong className="text-white truncate max-w-[160px]">{asset.location}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" /> Người đang giữ:
                    </span>
                    <strong className={asset.current_holder_name ? 'text-amber-300' : 'text-emerald-400'}>
                      {asset.current_holder_name || 'Kho Studio'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-500">Người phụ trách:</span>
                    <span className="text-slate-300">{asset.manager_name || 'Quản lý kho'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                  <Link
                    href={`/assets/${asset.code}`}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Xem QR & Lịch sử</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedAssetForIssue(asset)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                      title="Báo hỏng / Báo sự cố"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedAssetForTransfer(asset);
                        setIsTransferModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-orange-600 hover:text-white text-slate-200 text-xs font-semibold rounded-xl transition"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Bàn giao</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW ASSET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#131B2E] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                Thêm Thiết Bị Mới Vào Studio
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mã tài sản <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="VD: MMM-CAM-004"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Danh mục <span className="text-orange-500">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as AssetCategory)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tên thiết bị <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="VD: Body Sony Alpha 7 IV hoặc Lens Sony 24-70 GM II"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    placeholder="VD: ILCE-7M4"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Số Serial (S/N)
                  </label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={e => setNewSerial(e.target.value)}
                    placeholder="VD: SN-884920"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Vị trí cất giữ ban đầu
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="VD: Tủ chống ẩm A1"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Người phụ trách chính
                  </label>
                  <select
                    value={newManagerId}
                    onChange={e => setNewManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Đường dẫn ảnh thiết bị (URL)
                </label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="https://... (hoặc để trống dùng ảnh mặc định)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ghi chú phụ kiện kèm theo
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="VD: Kèm 2 pin FZ100, sạc đôi, dây đeo, thẻ nhớ..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition"
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
