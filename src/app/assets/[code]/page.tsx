'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from '@/components/StatusBadge';
import { TransferModal } from '@/components/TransferModal';
import { ConfirmTransferModal } from '@/components/ConfirmTransferModal';
import { IssueReportModal } from '@/components/IssueReportModal';
import { TransferRecord } from '@/types';
import { 
  ArrowLeft, 
  Boxes, 
  QrCode, 
  Printer, 
  ArrowRightLeft, 
  MapPin, 
  User, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Download,
  Info,
  Camera,
  History
} from 'lucide-react';

export default function AssetDetailPage() {
  const params = useParams();
  const assetCode = params.code as string;

  const { assets, transfers, currentUser } = useApp();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedTransferForConfirm, setSelectedTransferForConfirm] = useState<TransferRecord | null>(null);

  const asset = assets.find(
    a => a.code.toUpperCase() === assetCode?.toUpperCase()
  );

  // Generate QR Code
  useEffect(() => {
    if (!asset) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matmotmimedia.vn';
    const targetUrl = `${origin}/assets/${asset.code}`;

    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }).then(url => setQrDataUrl(url)).catch(err => console.error(err));
  }, [asset]);

  if (!asset) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Boxes className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy thiết bị {assetCode}</h2>
        <p className="text-xs text-slate-500">
          Mã thiết bị này không tồn tại trong hệ thống của Mắt Một Mí Media.
        </p>
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách thiết bị
        </Link>
      </div>
    );
  }

  // Transfers relating to this specific asset
  const assetTransfers = transfers.filter(t => t.asset_id === asset.id);
  const activePendingTransfer = assetTransfers.find(t => t.status === 'pending');

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR-${asset.code}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh sách thiết bị</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{asset.status === 'alert' ? 'Xử lý sự cố' : 'Báo sự cố'}</span>
          </button>
        </div>
      </div>

      {/* Main Detail Header Card (Clean White) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Asset Image */}
          <div className="md:col-span-1 space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.image_url}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="font-mono text-xs font-black bg-white/95 text-orange-700 px-2.5 py-1 rounded-md shadow-sm border border-orange-200">
                  {asset.code}
                </span>
              </div>
            </div>

            {/* Quick Handover Button */}
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Bàn Giao / Mượn Máy Này</span>
            </button>
          </div>

          {/* Asset Details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StatusBadge status={asset.status} alertReason={asset.alert_reason} size="md" />
                <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full font-bold">
                  {asset.category.toUpperCase()}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {asset.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Mã: <strong className="text-orange-600">{asset.code}</strong> | Model: {asset.model || 'N/A'} | S/N: {asset.serial_number || 'N/A'}
              </p>
            </div>

            {/* Location & Ownership status cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  Người đang giữ thiết bị:
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {asset.current_holder_name ? (
                    <span className="text-amber-800">{asset.current_holder_name}</span>
                  ) : (
                    <span className="text-emerald-700">Kho Studio (Sẵn sàng)</span>
                  )}
                </div>
                {asset.due_date && asset.current_holder_id && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Hạn trả: <strong>{new Date(asset.due_date).toLocaleDateString('vi-VN')}</strong>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Vị trí hiện tại:
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {asset.location}
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Người phụ trách: {asset.manager_name || 'Quản lý kho'}
                </div>
              </div>
            </div>

            {/* Notes / Accessories */}
            {asset.notes && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-orange-600" />
                  Phụ kiện kèm theo & ghi chú:
                </div>
                <p>{asset.notes}</p>
              </div>
            )}

            {/* If there is a pending handover waiting for confirmation */}
            {activePendingTransfer && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
                    <Clock className="w-4 h-4 animate-spin text-orange-600" />
                    <span>Thiết bị đang có giao dịch chờ xác nhận!</span>
                  </div>
                  <button
                    onClick={() => setSelectedTransferForConfirm(activePendingTransfer)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    Xem & Xác nhận
                  </button>
                </div>
                <div className="text-xs text-slate-700">
                  {activePendingTransfer.from_user_name} ➔ {activePendingTransfer.to_user_name}
                  {activePendingTransfer.giver_notes && ` ("${activePendingTransfer.giver_notes}")`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Printable Section */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-2xl">
          <div className="flex items-center gap-4">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`QR ${asset.code}`}
                className="w-20 h-20 bg-white p-1 rounded-xl shadow-sm border border-slate-200"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-200 animate-pulse rounded-xl" />
            )}
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-orange-600" />
                Mã QR Dán Lên Thiết Bị
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                In tem dán trực tiếp lên máy ảnh hoặc lens để kiểm kê, mượn trả bằng điện thoại
              </p>
              <div className="text-[11px] font-mono text-orange-700 font-bold mt-1">
                Mã: {asset.code}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={downloadQR}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Tải file ảnh</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>In Tem</span>
            </button>
          </div>
        </div>
      </div>

      {/* LỊCH SỬ MƯỢN TRẢ & BÀN GIAO */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-orange-600" />
            Lịch Sử Bàn Giao & Mượn Trả ({assetTransfers.length})
          </h3>
          <span className="text-xs text-slate-500">
            Minh bạch từng đợt sử dụng
          </span>
        </div>

        {assetTransfers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Chưa có lịch sử bàn giao nào cho thiết bị này.
          </div>
        ) : (
          <div className="space-y-3">
            {assetTransfers.map(tr => (
              <div
                key={tr.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      tr.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : tr.status === 'pending'
                        ? 'bg-orange-100 text-orange-800 animate-pulse'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tr.status === 'completed' ? 'Đã hoàn tất' : tr.status === 'pending' ? 'Chờ xác nhận' : 'Đã từ chối'}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {new Date(tr.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="text-slate-600 font-semibold">
                    Loại: {tr.transfer_type === 'return' ? 'Trả kho' : tr.transfer_type === 'borrow' ? 'Mượn kho' : 'Bàn giao trực tiếp'}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-800">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>Người giao: <strong>{tr.from_user_name}</strong></span>
                  <span className="text-slate-400">➔</span>
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Người nhận: <strong>{tr.to_user_name}</strong></span>
                </div>

                {tr.giver_notes && (
                  <div className="p-2.5 bg-white rounded-xl text-slate-700 border border-slate-200">
                    <span className="text-slate-500 block mb-0.5 font-medium">Hiện trạng giao:</span>
                    &quot;{tr.giver_notes}&quot;
                  </div>
                )}

                {tr.giver_photos && tr.giver_photos.length > 0 && (
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Ảnh chụp hiện trạng:</span>
                    <div className="flex flex-wrap gap-2">
                      {tr.giver_photos.map((p, idx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={idx}
                          src={p}
                          alt="Hiện trạng"
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {tr.status === 'pending' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setSelectedTransferForConfirm(tr)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm transition"
                    >
                      Xác nhận giao dịch này
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        preSelectedAsset={asset}
      />

      <ConfirmTransferModal
        isOpen={Boolean(selectedTransferForConfirm)}
        onClose={() => setSelectedTransferForConfirm(null)}
        transfer={selectedTransferForConfirm}
      />

      <IssueReportModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        asset={asset}
      />
    </div>
  );
}
