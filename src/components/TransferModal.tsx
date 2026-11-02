'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Asset, TransferType, EquipmentCombo } from '@/types';
import { compressImage } from '@/lib/image-utils';
import { 
  ArrowRightLeft, 
  X, 
  Camera, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Check, 
  User, 
  Trash2,
  Boxes,
  Plus,
  CheckSquare,
  Square,
  BookmarkPlus,
  Layers,
  Search,
  Sparkles
} from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAsset?: Asset | null;
  initialCombo?: EquipmentCombo | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  preSelectedAsset,
  initialCombo,
}) => {
  const { 
    assets, 
    profiles, 
    currentUser, 
    combos, 
    addCombo, 
    initiateTransfer, 
    initiateComboTransfer 
  } = useApp();

  // Mode: single asset or combo
  const [mode, setMode] = useState<'single' | 'combo'>('single');

  // Single asset state
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    preSelectedAsset ? preSelectedAsset.id : ''
  );

  // Combo state
  const [selectedComboId, setSelectedComboId] = useState<string>('');
  const [selectedComboAssetIds, setSelectedComboAssetIds] = useState<string[]>([]);
  const [comboNameInput, setComboNameInput] = useState<string>('');
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>('');
  const [isSavingNewCombo, setIsSavingNewCombo] = useState<boolean>(false);
  const [newComboTitle, setNewComboTitle] = useState<string>('');
  const [newComboDesc, setNewComboDesc] = useState<string>('');

  // Common transfer state
  const [toUserId, setToUserId] = useState<string>('');
  const [transferType, setTransferType] = useState<TransferType>('peer_transfer');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [locationAfter, setLocationAfter] = useState<string>('');
  const [giverNotes, setGiverNotes] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prevIsOpenRef = useRef(false);
  const prevAssetIdRef = useRef<string | null>(null);

  const handleClose = () => {
    setToUserId('');
    setGiverNotes('');
    setPhotos([]);
    setError(null);
    setIsSubmitting(false);
    setSelectedComboAssetIds([]);
    setComboNameInput('');
    setIsSavingNewCombo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isNewAsset = isOpen && preSelectedAsset && preSelectedAsset.id !== prevAssetIdRef.current;

    if (isOpening || isNewAsset) {
      if (initialCombo) {
        setMode('combo');
        setSelectedComboId(initialCombo.id);
        setComboNameInput(initialCombo.name);
        const matchedIds = initialCombo.asset_codes
          .map(code => assets.find(a => a.code.toUpperCase() === code.toUpperCase())?.id)
          .filter((id): id is string => Boolean(id));
        setSelectedComboAssetIds(matchedIds);
        if (initialCombo.description) {
          setGiverNotes(initialCombo.description);
        }
      } else if (preSelectedAsset) {
        setMode('single');
        setSelectedAssetId(preSelectedAsset.id);
        setLocationAfter(preSelectedAsset.location || '');
        if (preSelectedAsset.current_holder_id === currentUser.id) {
          setTransferType('peer_transfer');
        } else if (!preSelectedAsset.current_holder_id) {
          setTransferType('borrow');
        } else {
          setTransferType('peer_transfer');
        }
      } else {
        const targetAsset = assets.length > 0 ? assets[0] : null;
        if (targetAsset) {
          setSelectedAssetId(targetAsset.id);
          setLocationAfter(targetAsset.location || '');
        }
      }

      if (isOpening) {
        setToUserId('');
        setDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setGiverNotes('');
        setPhotos([]);
        setError(null);
        setIsSubmitting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }

    prevIsOpenRef.current = isOpen;
    prevAssetIdRef.current = preSelectedAsset?.id || null;
  }, [isOpen, preSelectedAsset?.id, initialCombo]);

  if (!isOpen) return null;

  const availableReceivers = profiles.filter(
    p => p.status === 'active' && (transferType === 'borrow' ? true : p.id !== currentUser.id)
  );

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const compressedList = await Promise.all(
        Array.from(files).map(file => compressImage(file))
      );
      setPhotos(prev => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectComboTemplate = (comboId: string) => {
    setSelectedComboId(comboId);
    if (comboId === 'custom' || !comboId) {
      return;
    }
    const found = combos.find(c => c.id === comboId);
    if (found) {
      setComboNameInput(found.name);
      const matchedIds = found.asset_codes
        .map(code => assets.find(a => a.code.toUpperCase() === code.toUpperCase())?.id)
        .filter((id): id is string => Boolean(id));
      setSelectedComboAssetIds(matchedIds);
      if (!giverNotes && found.description) {
        setGiverNotes(found.description);
      }
    }
  };

  const handleToggleComboAsset = (assetId: string) => {
    setSelectedComboAssetIds(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSaveCurrentAsCombo = () => {
    if (!newComboTitle.trim()) {
      alert('Vui lòng nhập tên Combo!');
      return;
    }
    if (selectedComboAssetIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thiết bị để tạo Combo!');
      return;
    }
    const codes = selectedComboAssetIds
      .map(id => assets.find(a => a.id === id)?.code)
      .filter((c): c is string => Boolean(c));

    const created = addCombo({
      name: newComboTitle.trim(),
      description: newComboDesc.trim(),
      asset_codes: codes,
    });

    setSelectedComboId(created.id);
    setComboNameInput(created.name);
    setIsSavingNewCombo(false);
    setNewComboTitle('');
    setNewComboDesc('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'single') {
      if (!selectedAssetId) {
        setError('Vui lòng chọn thiết bị bàn giao');
        return;
      }
      if (!toUserId) {
        setError('Vui lòng chọn người nhận thiết bị');
        return;
      }
      if (photos.length === 0 && !giverNotes.trim()) {
        setError('Vui lòng chụp ít nhất 1 ảnh hiện trạng hoặc ghi rõ tình trạng thiết bị khi bàn giao!');
        return;
      }

      setIsSubmitting(true);
      const result = initiateTransfer({
        assetId: selectedAssetId,
        toUserId,
        transferType,
        dueDate: transferType === 'return' ? null : (dueDate ? new Date(dueDate).toISOString() : null),
        locationAfter: locationAfter.trim() || 'Kho Studio',
        giverNotes: giverNotes.trim(),
        giverPhotos: photos,
      });
      setIsSubmitting(false);

      if (result.success) {
        handleClose();
      } else {
        setError(result.error || 'Có lỗi xảy ra khi tạo bàn giao');
      }
    } else {
      // Combo Mode
      if (selectedComboAssetIds.length === 0) {
        setError('Vui lòng chọn ít nhất 1 thiết bị trong Combo để bàn giao!');
        return;
      }
      if (!toUserId) {
        setError('Vui lòng chọn người nhận Combo thiết bị');
        return;
      }
      if (photos.length === 0 && !giverNotes.trim()) {
        setError('Vui lòng chụp ít nhất 1 ảnh hiện trạng bộ thiết bị hoặc ghi rõ tình trạng máy móc!');
        return;
      }

      setIsSubmitting(true);
      const result = initiateComboTransfer({
        assetIds: selectedComboAssetIds,
        comboName: comboNameInput.trim() || 'Combo Thiết Bị',
        toUserId,
        transferType,
        dueDate: transferType === 'return' ? null : (dueDate ? new Date(dueDate).toISOString() : null),
        locationAfter: locationAfter.trim() || 'Kho Studio',
        giverNotes: giverNotes.trim(),
        giverPhotos: photos,
      });
      setIsSubmitting(false);

      if (result.success) {
        handleClose();
      } else {
        setError(result.error || 'Có lỗi xảy ra khi bàn giao combo');
      }
    }
  };

  // Filter assets in combo selection
  const filteredComboAssets = assets.filter(a =>
    a.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(assetSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {mode === 'combo' ? 'Bàn Giao Combo Thiết Bị' : 'Tạo Bàn Giao Thiết Bị'}
              </h3>
              <p className="text-xs text-slate-500">
                Thao tác nhanh • Chọn 1 máy hoặc cả bộ combo • Đồng bộ tức thì
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-4 sm:px-6 pt-3">
          <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Bàn giao 1 thiết bị</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('combo')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'combo'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Bàn giao theo Combo / Cả bộ</span>
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE 1: SINGLE ASSET */}
          {mode === 'single' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                1. Thiết bị bàn giao <span className="text-orange-600">*</span>
              </label>
              <select
                value={selectedAssetId}
                onChange={e => {
                  const newId = e.target.value;
                  setSelectedAssetId(newId);
                  const asset = assets.find(a => a.id === newId);
                  if (asset) {
                    setLocationAfter(asset.location || '');
                    if (asset.current_holder_id === currentUser.id) {
                      setTransferType('peer_transfer');
                    } else if (!asset.current_holder_id) {
                      setTransferType('borrow');
                    } else {
                      setTransferType('peer_transfer');
                    }
                  }
                  setPhotos([]);
                  setGiverNotes('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                required
              >
                <option value="" disabled>-- Chọn thiết bị trong studio --</option>
                {assets.map(a => (
                  <option 
                    key={a.id} 
                    value={a.id}
                    disabled={a.status === 'pending_transfer'}
                  >
                    {a.code} - {a.name} ({a.status === 'pending_transfer' ? 'Đang chờ xác nhận' : a.location})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* MODE 2: COMBO SELECTION */}
          {mode === 'combo' && (
            <div className="space-y-3 bg-orange-50/40 border border-orange-200/80 p-3.5 sm:p-4 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-orange-600" />
                  <span>1. Chọn Combo bộ thiết bị hoặc gom máy mới</span>
                  <span className="text-orange-600">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsSavingNewCombo(!isSavingNewCombo)}
                  className="text-xs text-orange-700 hover:text-orange-900 font-bold flex items-center gap-1 self-start sm:self-auto"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{isSavingNewCombo ? 'Đóng tạo Combo' : '+ Lưu thành Combo mẫu'}</span>
                </button>
              </div>

              {/* Combo Preset Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedComboId}
                  onChange={e => handleSelectComboTemplate(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Chọn Combo mẫu đã lưu ({combos.length}) --</option>
                  {combos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.asset_codes.length} thiết bị)
                    </option>
                  ))}
                  <option value="custom">✏️ Tự chọn các thiết bị thủ công</option>
                </select>

                <input
                  type="text"
                  placeholder="Đặt tên cho đợt bàn giao này (VD: Combo Chụp Phóng Sự)..."
                  value={comboNameInput}
                  onChange={e => setComboNameInput(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 placeholder-slate-400"
                />
              </div>

              {/* Save New Combo Form Inline */}
              {isSavingNewCombo && (
                <div className="p-3 bg-white border border-orange-200 rounded-xl space-y-2 text-xs shadow-sm">
                  <div className="font-bold text-orange-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                    <span>Lưu {selectedComboAssetIds.length} thiết bị đã chọn thành Combo mới:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Tên Combo (VD: Combo Quay Phim Highlight)"
                      value={newComboTitle}
                      onChange={e => setNewComboTitle(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Mô tả (VD: Gồm 1 FX3, 24-70 GM, RS3, 2 pin)"
                      value={newComboDesc}
                      onChange={e => setNewComboDesc(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSavingNewCombo(false)}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px]"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCurrentAsCombo}
                      className="px-3 py-1 bg-orange-600 text-white rounded-lg text-[11px] font-bold shadow-sm"
                    >
                      Lưu Combo vào hệ thống
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-select Equipment in Combo */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm thiết bị để gom vào combo..."
                      value={assetSearchQuery}
                      onChange={e => setAssetSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-lg shrink-0">
                    Đã chọn: {selectedComboAssetIds.length} máy
                  </span>
                </div>

                {/* Equipment Checkbox List */}
                <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                  {filteredComboAssets.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      Không tìm thấy thiết bị phù hợp.
                    </div>
                  ) : (
                    filteredComboAssets.map(asset => {
                      const isChecked = selectedComboAssetIds.includes(asset.id);
                      const isPending = asset.status === 'pending_transfer';

                      return (
                        <label
                          key={asset.id}
                          className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition ${
                            isChecked ? 'bg-orange-50 font-bold' : 'hover:bg-slate-50'
                          } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isPending}
                              onChange={() => handleToggleComboAsset(asset.id)}
                              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="font-mono text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded text-[11px] shrink-0">
                              {asset.code}
                            </span>
                            <span className="text-slate-800 truncate">{asset.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                            <span className="text-slate-400 hidden sm:inline">{asset.location}</span>
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              asset.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                              asset.status === 'in_use' ? 'bg-amber-100 text-amber-800' :
                              asset.status === 'pending_transfer' ? 'bg-orange-100 text-orange-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {asset.status === 'available' ? '🟢 Sẵn sàng' : 
                               asset.status === 'in_use' ? '🟡 Đang giữ' : 
                               asset.status === 'pending_transfer' ? '🟠 Chờ duyệt' : '🔴 Lỗi'}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loại giao dịch */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'peer_transfer', label: 'Chuyển đồng nghiệp' },
              { type: 'borrow', label: 'Mượn từ kho' },
              { type: 'return', label: 'Trả lại kho' },
            ].map(item => (
              <button
                type="button"
                key={item.type}
                onClick={() => setTransferType(item.type as TransferType)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition ${
                  transferType === item.type
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Người giao & Người nhận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Người giao (Bạn)
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold">
                <User className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="truncate">{currentUser.full_name}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                2. Người nhận máy <span className="text-orange-600">*</span>
              </label>
              <select
                value={toUserId}
                onChange={e => setToUserId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                required
              >
                <option value="">-- Chọn nhân sự nhận --</option>
                {availableReceivers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} {p.id === currentUser.id ? '(Chính bạn)' : `(${p.role === 'admin' ? 'Admin' : p.role === 'manager' ? 'Quản lý' : 'Nhân sự'})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vị trí mới & Hạn trả */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Vị trí sau khi bàn giao
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="VD: Cốp xe Đăng, Vali show..."
                  value={locationAfter}
                  onChange={e => setLocationAfter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            {transferType !== 'return' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Hạn trả dự kiến
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Chụp ảnh hiện trạng khi giao */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-600" />
                3. Ảnh chụp hiện trạng máy móc lúc giao
              </label>
              <span className="text-[11px] text-slate-500 font-semibold">{photos.length} ảnh đã chụp</span>
            </div>

            {/* Photos Preview Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {photos.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Hiện trạng ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                disabled={isCompressing}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 hover:bg-orange-50/50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-orange-600 transition disabled:opacity-50"
              >
                {isCompressing ? (
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                <span className="text-[10px] font-bold">
                  {isCompressing ? 'Đang nén...' : 'Chụp / Chọn ảnh'}
                </span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handlePhotoCapture}
            />
          </div>

          {/* Ghi chú tình trạng thiết bị */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Ghi chú hiện trạng & phụ kiện kèm theo (pin, sạc, thẻ nhớ...)
            </label>
            <textarea
              rows={2}
              value={giverNotes}
              onChange={e => setGiverNotes(e.target.value)}
              placeholder="VD: Cả bộ sạch đẹp, kèm 2 pin FZ100, 1 sạc đôi, thẻ nhớ 128GB, túi show..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Two-party warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Quy định xác nhận 2 bên:</p>
              <p className="text-[11px] text-amber-800">
                Sau khi gửi, {mode === 'combo' ? `cả ${selectedComboAssetIds.length} thiết bị` : 'thiết bị'} chuyển sang màu 🟠 Cam. Người nhận ({profiles.find(p => p.id === toUserId)?.full_name || '...'}) cần bấm duyệt để chính thức hoàn tất.
              </p>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 flex items-center gap-2 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              {isSubmitting
                ? 'Đang gửi...'
                : isCompressing
                ? 'Đang nén ảnh...'
                : mode === 'combo'
                ? `Gửi bàn giao Combo (${selectedComboAssetIds.length} thiết bị)`
                : 'Gửi yêu cầu bàn giao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
