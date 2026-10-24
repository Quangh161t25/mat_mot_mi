'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Asset, TransferType } from '@/types';
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  React.useEffect(() => {
    const isOpening = isOpen && !prevIsOpenRef.current;
    const isNewAsset = isOpen && preSelectedAsset && preSelectedAsset.id !== prevAssetIdRef.current;

    if (isOpening || isNewAsset) {
      const targetAsset = preSelectedAsset || (assets.length > 0 ? assets[0] : null);
      if (targetAsset) {
        setSelectedAssetId(targetAsset.id);
        setLocationAfter(targetAsset.location || '');
        if (targetAsset.current_holder_id === currentUser.id) {
          setTransferType('peer_transfer');
        } else if (!targetAsset.current_holder_id) {
          setTransferType('borrow');
        } else {
          setTransferType('peer_transfer');
        }
      } else {
        setSelectedAssetId('');
        setLocationAfter('');
        setTransferType('borrow');
      }

      // CHỈ RESET DỮ LIỆU KHI MỞ MỚI MODAL
      // TUYỆT ĐỐI KHÔNG RESET KHI NGƯỜI DÙNG ĐANG ĐIỀN FORM HOẶC QUAY LẠI TỪ CAMERA / TAB ĐIỆN THOẠI
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
  }, [isOpen, preSelectedAsset?.id]);

  if (!isOpen) return null;

  const currentSelectedAsset = assets.find(a => a.id === selectedAssetId);

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
      // Reset input để người dùng có thể chọn thêm ảnh mới bất cứ lúc nào
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      handleClose();
    } else {
      setError(result.error || 'Có lỗi xảy ra khi tạo bàn giao');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Tạo Bàn Giao Thiết Bị
              </h3>
              <p className="text-xs text-slate-500">
                Thao tác nhanh 3 bước • Xác nhận hai bên an toàn
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Chọn Thiết Bị */}
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
                // Reset ảnh và ghi chú khi đổi thiết bị để không nhầm hiện trạng
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
                  placeholder="VD: Cốp xe Đăng, Túi show..."
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
              Ghi chú hiện trạng (phụ kiện kèm theo, số lượng pin)
            </label>
            <textarea
              rows={2}
              value={giverNotes}
              onChange={e => setGiverNotes(e.target.value)}
              placeholder="VD: Máy sạch đẹp, kèm 2 pin FZ100, 1 sạc đôi và thẻ nhớ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Two-party warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Quy định xác nhận 2 bên:</p>
              <p className="text-[11px] text-amber-800">
                Sau khi gửi, thiết bị chuyển sang màu 🟠 Cam. Người nhận ({profiles.find(p => p.id === toUserId)?.full_name || '...'}) cần bấm duyệt để chính thức hoàn tất.
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
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi...' : isCompressing ? 'Đang nén ảnh...' : 'Gửi yêu cầu bàn giao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
