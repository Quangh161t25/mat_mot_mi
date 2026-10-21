'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '@/context/AppContext';
import { TransferRecord } from '@/types';
import { 
  CheckCircle2, 
  X, 
  Camera, 
  User, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck,
  Trash2
} from 'lucide-react';

interface ConfirmTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: TransferRecord | null;
}

export const ConfirmTransferModal: React.FC<ConfirmTransferModalProps> = ({
  isOpen,
  onClose,
  transfer,
}) => {
  const { currentUser, confirmTransfer, rejectTransfer, canManageEquipment } = useApp();

  const [receiverNotes, setReceiverNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !transfer) return null;

  const isRecipient = currentUser.id === transfer.to_user_id;
  const isGiver = currentUser.id === transfer.from_user_id;
  const canConfirm = (isRecipient || canManageEquipment) && !isGiver;

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

  const handleConfirm = () => {
    setError(null);
    const result = confirmTransfer(transfer.id, receiverNotes, photos);

    if (result.success) {
      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore confetti errors
      }
      onClose();
    } else {
      setError(result.error || 'Không thể xác nhận giao dịch');
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError('Vui lòng nêu rõ lý do từ chối nhận thiết bị');
      return;
    }
    rejectTransfer(transfer.id, rejectReason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Xác Nhận Nhận Thiết Bị
              </h3>
              <p className="text-xs text-slate-400">
                Kiểm tra hiện trạng và xác nhận tiếp nhận tài sản
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Asset Info Card */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
            {transfer.asset_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transfer.asset_image}
                alt={transfer.asset_name}
                className="w-14 h-14 rounded-xl object-cover border border-slate-700"
              />
            )}
            <div>
              <div className="font-mono text-xs font-bold text-orange-400">
                {transfer.asset_code}
              </div>
              <div className="text-sm font-bold text-white">
                {transfer.asset_name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Loại: {transfer.transfer_type === 'return' ? 'Trả kho' : transfer.transfer_type === 'borrow' ? 'Mượn kho' : 'Bàn giao trực tiếp'}
              </div>
            </div>
          </div>

          {/* Giver Details & Condition Photos */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thông tin từ người giao
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>Người giao: <strong>{transfer.from_user_name}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Người nhận: <strong>{transfer.to_user_name}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Vị trí: <strong>{transfer.location_after || 'Kho Studio'}</strong></span>
              </div>
              {transfer.due_date && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hạn trả: <strong>{new Date(transfer.due_date).toLocaleDateString('vi-VN')}</strong></span>
                </div>
              )}
            </div>

            {transfer.giver_notes && (
              <div className="p-2.5 bg-slate-950/60 rounded-xl text-xs text-slate-300 border border-slate-800">
                <span className="text-slate-500 block mb-0.5 font-medium">Ghi chú hiện trạng lúc giao:</span>
                &quot;{transfer.giver_notes}&quot;
              </div>
            )}

            {/* Giver photos */}
            {transfer.giver_photos && transfer.giver_photos.length > 0 && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Ảnh chụp hiện trạng khi giao:</span>
                <div className="grid grid-cols-3 gap-2">
                  {transfer.giver_photos.map((p, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={p}
                      alt="Hiện trạng lúc giao"
                      className="aspect-square rounded-xl object-cover border border-slate-700"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Validation Notice for Non-recipients */}
          {!canConfirm && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Quy định bảo vệ tài sản:</strong> Bạn là người giao ({transfer.from_user_name}), không được tự xác nhận đã nhận lại! Chỉ {transfer.to_user_name} hoặc Quản lý kho mới được bấm xác nhận.
              </span>
            </div>
          )}

          {/* Receiver verification inputs */}
          {canConfirm && !isRejecting && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ghi chú kiểm tra lúc nhận (nếu có)
                </label>
                <textarea
                  rows={2}
                  value={receiverNotes}
                  onChange={e => setReceiverNotes(e.target.value)}
                  placeholder="Ví dụ: Đã nhận đủ máy + 2 pin, máy hoạt động bình thường..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Chụp ảnh đối chứng khi nhận (tùy chọn)
                  </label>
                  <span className="text-[11px] text-slate-400">{photos.length} ảnh</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Hiện trạng nhận ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/40 hover:bg-emerald-500/5 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-400 transition"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Chụp ảnh</span>
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
            </div>
          )}

          {/* Rejection form */}
          {isRejecting && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
              <label className="text-xs font-bold text-rose-300 block">
                Lý do từ chối nhận thiết bị:
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Thiếu cáp sạc, máy bị trầy xước không báo trước..."
                className="w-full px-3 py-2 bg-slate-900 border border-rose-500/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
            {canConfirm && !isRejecting && (
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Từ chối nhận
              </button>
            )}

            {isRejecting && (
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-3 py-2 text-slate-400 hover:text-white rounded-xl text-xs transition"
              >
                Quay lại
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Đóng
              </button>

              {isRejecting ? (
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition"
                >
                  Xác nhận từ chối
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận đã nhận thiết bị
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
