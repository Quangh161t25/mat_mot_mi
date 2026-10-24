'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Asset, AlertReason } from '@/types';
import { AlertTriangle, X, Check, Wrench, XCircle, Clock } from 'lucide-react';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export const IssueReportModal: React.FC<IssueReportModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const { reportAssetIssue, resolveAssetIssue, canManageEquipment } = useApp();
  const [reason, setReason] = useState<AlertReason>('damaged');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setReason('damaged');
      setNotes('');
    }
  }, [isOpen, asset?.id]);

  if (!isOpen || !asset) return null;

  const isCurrentlyInAlert = asset.status === 'alert';

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    reportAssetIssue(asset.id, reason, notes);
    onClose();
  };

  const handleResolve = () => {
    const targetStatus = asset.current_holder_id ? 'in_use' : 'available';
    resolveAssetIssue(asset.id, targetStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isCurrentlyInAlert ? 'Xử Lý Sự Cố Thiết Bị' : 'Báo Cáo Sự Cố Thiết Bị'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{asset.code} - {asset.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCurrentlyInAlert ? (
          <div className="p-5 space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1.5">
              <div className="font-bold text-rose-800">
                🔴 Tình trạng hiện tại: {asset.alert_reason === 'damaged' ? 'Hư hỏng / Kỹ thuật' : asset.alert_reason === 'lost' ? 'Mất thiết bị' : 'Quá hạn'}
              </div>
              <div className="text-slate-700">
                Ghi chú: {asset.notes || 'Không có ghi chú'}
              </div>
            </div>

            {canManageEquipment ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Nếu thiết bị đã được sửa chữa hoặc tìm lại, bạn có thể hoàn tất để đưa về trạng thái sẵn sàng sử dụng:
                </p>
                <button
                  type="button"
                  onClick={handleResolve}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
                >
                  <Check className="w-4 h-4" />
                  Đã giải quyết xong - Đưa về sẵn sàng (🟢)
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Chỉ Quản lý hoặc Admin mới có quyền gỡ bỏ cảnh báo sự cố này.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleReport} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Chọn loại vấn đề / sự cố
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'damaged', label: 'Hư hỏng', icon: Wrench },
                  { id: 'lost', label: 'Báo mất', icon: XCircle },
                  { id: 'maintenance', label: 'Bảo trì', icon: Clock },
                ].map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setReason(opt.id as AlertReason)}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                        reason === opt.id
                          ? 'bg-rose-50 text-rose-700 border-rose-400 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Chi tiết tình trạng sự cố
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Mô tả cụ thể: Vỡ kính lọc, kẹt trục, mất tại show nào..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/25 flex items-center gap-2 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                Đánh dấu sự cố (🔴 Đỏ)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
