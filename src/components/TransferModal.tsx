'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Asset, TransferType } from '@/types';
import { 
  ArrowRightLeft, 
  X, 
  Camera, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Check, 
  User, 
  Upload, 
  Trash2 
} from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAsset?: Asset | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  preSelectedAsset,
}) => {
  const { assets, profiles, currentUser, initiateTransfer } = useApp();

  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    preSelectedAsset ? preSelectedAsset.id : ''
  );
  const [toUserId, setToUserId] = useState<string>('');
  const [transferType, setTransferType] = useState<TransferType>('peer_transfer');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [locationAfter, setLocationAfter] = useState<string>('');
  const [giverNotes, setGiverNotes] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync preSelectedAsset when opened
  React.useEffect(() => {
    if (preSelectedAsset) {
      setSelectedAssetId(preSelectedAsset.id);
      setLocationAfter(preSelectedAsset.location);
      if (preSelectedAsset.current_holder_id === currentUser.id) {
        setTransferType('peer_transfer');
      } else if (!preSelectedAsset.current_holder_id) {
        setTransferType('borrow');
      }
    } else {
      setSelectedAssetId(assets[0]?.id || '');
    }
  }, [preSelectedAsset, isOpen, assets, currentUser]);

  if (!isOpen) return null;

  const currentSelectedAsset = assets.find(a => a.id === selectedAssetId);

  // Filter available receivers (active profiles except currentUser unless special override)
  const availableReceivers = profiles.filter(
    p => p.status === 'active' && p.id !== currentUser.id
  );

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setPhotos(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAssetId) {
      setError('Vui lòng chọn thiết bị');
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
      onClose();
    } else {
      setError(result.error || 'Có lỗi xảy ra khi tạo bàn giao');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Tạo Bàn Giao Thiết Bị (Mượn - Trả)
              </h3>
              <p className="text-xs text-slate-400">
                Xác nhận hai bên: Người trả không được tự xác nhận
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Chọn Thiết Bị */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Thiết bị bàn giao <span className="text-orange-500">*</span>
            </label>
            <select
              value={selectedAssetId}
              onChange={e => {
                setSelectedAssetId(e.target.value);
                const asset = assets.find(a => a.id === e.target.value);
                if (asset) setLocationAfter(asset.location);
              }}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
              required
            >
              <option value="" disabled>-- Chọn thiết bị --</option>
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
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition ${
                  transferType === item.type
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Người giao & Người nhận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Người giao (Bạn)
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200">
                <User className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-medium truncate">{currentUser.full_name}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Người nhận thiết bị <span className="text-orange-500">*</span>
              </label>
              <select
                value={toUserId}
                onChange={e => setToUserId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                required
              >
                <option value="">-- Chọn nhân sự nhận --</option>
                {availableReceivers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role === 'admin' ? 'Admin' : p.role === 'manager' ? 'Quản lý' : 'Nhân sự'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vị trí mới & Hạn trả */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Vị trí sau khi giao
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ví dụ: Balo Đăng, Kho Tầng 1..."
                  value={locationAfter}
                  onChange={e => setLocationAfter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {transferType !== 'return' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Hạn trả dự kiến
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Chụp ảnh hiện trạng khi giao (Requirement 4) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-400" />
                Chụp ảnh hiện trạng thiết bị khi giao
              </label>
              <span className="text-[11px] text-slate-400">{photos.length} ảnh đã chụp</span>
            </div>

            {/* Photos Preview Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {photos.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 group">
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
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-orange-500/60 bg-slate-900/40 hover:bg-orange-500/5 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-orange-400 transition"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px] font-medium">Chụp / Chọn ảnh</span>
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Ghi chú hiện trạng (phụ kiện kèm theo, vết xước nếu có)
            </label>
            <textarea
              rows={2}
              value={giverNotes}
              onChange={e => setGiverNotes(e.target.value)}
              placeholder="Ví dụ: Máy sạch cảm biến, kèm 2 pin zin, sạc và thẻ nhớ..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Two-party warning */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Quy định xác nhận 2 bên:</p>
              <p className="text-[11px] text-orange-200/80">
                Sau khi gửi yêu cầu, thiết bị sẽ chuyển sang màu 🟠 Cam. Người nhận ({profiles.find(p => p.id === toUserId)?.full_name || '...'}) cần đăng nhập để xác nhận đã nhận thiết bị.
              </p>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Đang tạo...' : 'Gửi yêu cầu bàn giao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
