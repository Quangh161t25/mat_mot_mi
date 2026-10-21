'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { QRScannerModal } from '@/components/QRScannerModal';
import { AssetStatus } from '@/types';
import { 
  ClipboardCheck, 
  Plus, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  User, 
  MapPin, 
  Check, 
  X,
  FileSpreadsheet,
  Boxes
} from 'lucide-react';

export default function AuditPage() {
  const { 
    auditSessions, 
    auditItems, 
    assets, 
    profiles, 
    currentUser, 
    createAuditSession, 
    recordAuditScan, 
    completeAuditSession 
  } = useApp();

  const [activeSessionId, setActiveSessionId] = useState<string>(
    auditSessions[0]?.id || ''
  );

  // Modals
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRecordScanModalOpen, setIsRecordScanModalOpen] = useState(false);

  // New session state
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Scanned item form state
  const [scannedCode, setScannedCode] = useState('');
  const [actualLocation, setActualLocation] = useState('Kho Studio Tầng 1');
  const [actualHolderId, setActualHolderId] = useState<string>('');
  const [actualStatus, setActualStatus] = useState<AssetStatus>('available');
  const [scanNotes, setScanNotes] = useState('');
  const [scanResultAlert, setScanResultAlert] = useState<{
    hasDiscrepancy: boolean;
    details?: string;
  } | null>(null);

  const currentSession = auditSessions.find(s => s.id === activeSessionId) || auditSessions[0];
  const sessionItems = auditItems.filter(item => item.session_id === currentSession?.id);
  const discrepancyItems = sessionItems.filter(i => i.has_discrepancy);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newId = createAuditSession(newTitle.trim(), newNotes.trim());
    setActiveSessionId(newId);
    setIsNewSessionModalOpen(false);
    setNewTitle('');
    setNewNotes('');
  };

  const handleQRSuccess = (code: string) => {
    setIsScannerOpen(false);
    const asset = assets.find(a => a.code.toUpperCase() === code.toUpperCase());
    setScannedCode(code);
    if (asset) {
      setActualLocation(asset.location);
      setActualHolderId(asset.current_holder_id || '');
      setActualStatus(asset.status);
    }
    setIsRecordScanModalOpen(true);
  };

  const handleSaveAuditScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;

    const result = recordAuditScan({
      sessionId: currentSession.id,
      assetCode: scannedCode,
      actualLocation,
      actualHolderId: actualHolderId || null,
      actualStatus,
      notes: scanNotes,
    });

    if (result.success && result.item) {
      setScanResultAlert({
        hasDiscrepancy: result.item.has_discrepancy,
        details: result.item.discrepancy_details,
      });

      // Clear code for next scan
      setTimeout(() => {
        setIsRecordScanModalOpen(false);
        setScanResultAlert(null);
        setScanNotes('');
      }, 1500);
    } else {
      alert(result.error || 'Có lỗi xảy ra');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!currentSession || sessionItems.length === 0) {
      alert('Chưa có dữ liệu kiểm kê để xuất.');
      return;
    }

    const headers = [
      'Mã tài sản',
      'Tên thiết bị',
      'Thời gian quét',
      'Người quét',
      'Vị trí hệ thống',
      'Vị trí thực tế',
      'Người giữ hệ thống',
      'Người giữ thực tế',
      'Tình trạng hệ thống',
      'Tình trạng thực tế',
      'Có sai lệch',
      'Chi tiết sai lệch',
      'Ghi chú',
    ];

    const rows = sessionItems.map(item => [
      item.asset_code,
      `"${item.asset_name.replace(/"/g, '""')}"`,
      new Date(item.scanned_at).toLocaleString('vi-VN'),
      `"${item.scanned_by_name}"`,
      `"${item.expected_location}"`,
      `"${item.actual_location}"`,
      `"${item.expected_holder_name || 'Kho'}"`,
      `"${item.actual_holder_name || 'Kho'}"`,
      item.expected_status,
      item.actual_status,
      item.has_discrepancy ? 'CÓ SAI LỆCH' : 'KHỚP',
      `"${item.discrepancy_details || ''}"`,
      `"${item.notes || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KiemKe-${currentSession.title.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-orange-500" />
            Kiểm Kê Tài Sản & Đối Soát Sai Lệch
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Quét QR kiểm tra thực tế, tự động phát hiện sai lệch vị trí, người giữ và tình trạng
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewSessionModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>Tạo Đợt Kiểm Kê Mới</span>
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/30 transition active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Quét QR Kiểm Kê</span>
          </button>
        </div>
      </div>

      {/* Session Selector & Stats Bar */}
      {currentSession && (
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase">
                  Đợt kiểm kê đang chọn
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSession.status === 'in_progress'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {currentSession.status === 'in_progress' ? 'Đang thực hiện' : 'Đã hoàn tất'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {currentSession.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Khởi tạo bởi {currentSession.created_by_name} • Ngày {new Date(currentSession.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>

            {/* Session actions */}
            <div className="flex items-center gap-2">
              <select
                value={currentSession.id}
                onChange={e => setActiveSessionId(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {auditSessions.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                title="Xuất file Excel CSV"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Xuất CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                title="In báo cáo"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">In Báo Cáo</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 block">Đã quét thực tế:</span>
              <strong className="text-xl sm:text-2xl font-black text-white mt-1 block">
                {sessionItems.length} <span className="text-xs text-slate-500 font-normal">/ {assets.length} thiết bị</span>
              </strong>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <span className="text-xs text-emerald-400 block">Khớp 100%:</span>
              <strong className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
                {sessionItems.length - discrepancyItems.length}
              </strong>
            </div>

            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <span className="text-xs text-rose-400 block">Phát hiện sai lệch:</span>
              <strong className="text-xl sm:text-2xl font-black text-rose-400 mt-1 block">
                {discrepancyItems.length}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* DISCREPANCY ALERT LIST (Requirement 7) */}
      {discrepancyItems.length > 0 && (
        <div className="p-4 sm:p-5 bg-rose-500/10 border border-rose-500/30 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Cảnh Báo: Phát Hiện {discrepancyItems.length} Thiết Bị Sai Lệch So Với Thực Tế!
            </h3>
            <span className="text-xs text-rose-300 font-mono font-bold bg-rose-500/20 px-2 py-0.5 rounded-full">
              Hệ thống đã tự đồng bộ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {discrepancyItems.map(item => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-900/90 rounded-2xl border border-rose-500/30 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                    {item.asset_code}
                  </span>
                  <span className="text-slate-400">
                    {new Date(item.scanned_at).toLocaleTimeString('vi-VN')}
                  </span>
                </div>

                <div className="font-bold text-white text-sm">
                  {item.asset_name}
                </div>

                <div className="p-2 bg-rose-500/15 rounded-xl text-rose-300 font-medium border border-rose-500/20">
                  {item.discrepancy_details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scanned Items Log Table */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
          <Boxes className="w-5 h-5 text-orange-500" />
          Nhật Ký Quét Kiểm Kê Thực Tế ({sessionItems.length})
        </h3>

        {sessionItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <QrCode className="w-10 h-10 text-slate-600 mx-auto" />
            <p>Chưa có thiết bị nào được quét kiểm kê trong đợt này.</p>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition"
            >
              <QrCode className="w-4 h-4" /> Bắt đầu quét kiểm kê ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionItems.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                  item.has_discrepancy 
                    ? 'bg-rose-500/5 border-rose-500/30' 
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                      {item.asset_code}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {item.asset_name}
                    </span>
                    {item.has_discrepancy ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Sai lệch
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Khớp chính xác
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-400">
                    <span>Vị trí thực tế: <strong className="text-white">{item.actual_location}</strong></span>
                    <span>•</span>
                    <span>Người giữ: <strong className="text-white">{item.actual_holder_name}</strong></span>
                    <span>•</span>
                    <span>Người quét: <strong>{item.scanned_by_name}</strong> ({new Date(item.scanned_at).toLocaleTimeString('vi-VN')})</span>
                  </div>

                  {item.discrepancy_details && (
                    <div className="text-rose-400 text-[11px] font-medium">
                      {item.discrepancy_details}
                    </div>
                  )}

                  {item.notes && (
                    <div className="text-slate-400 italic text-[11px]">
                      Ghi chú: &quot;{item.notes}&quot;
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE NEW AUDIT SESSION MODAL */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#131B2E] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                Tạo Đợt Kiểm Kê Mới
              </h3>
              <button
                onClick={() => setIsNewSessionModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tên đợt kiểm kê <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="VD: Kiểm kê tổng kết cuối tuần hoặc Show Cưới Hạ Long"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mục đích / Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Kiểm kê toàn bộ body máy, lens và đèn tại kho trước mùa cưới cao điểm..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  Bắt đầu đợt kiểm kê
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD AUDIT SCAN MODAL */}
      {isRecordScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#131B2E] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-orange-500" />
                Đối Soát Thực Tế: {scannedCode}
              </h3>
              <button
                onClick={() => setIsRecordScanModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAuditScan} className="p-5 space-y-4">
              {scanResultAlert && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  scanResultAlert.hasDiscrepancy 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {scanResultAlert.hasDiscrepancy ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  )}
                  <span>
                    {scanResultAlert.hasDiscrepancy 
                      ? `Phát hiện sai lệch: ${scanResultAlert.details}` 
                      : 'Tuyệt vời! Thiết bị khớp chính xác với hệ thống.'}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Vị trí thực tế ghi nhận
                </label>
                <input
                  type="text"
                  required
                  value={actualLocation}
                  onChange={e => setActualLocation(e.target.value)}
                  placeholder="VD: Kho Studio Tầng 1, Tủ chống ẩm A1..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Người thực tế đang giữ
                </label>
                <select
                  value={actualHolderId}
                  onChange={e => setActualHolderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Kho Studio (Chưa ai giữ)</option>
                  {profiles.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tình trạng kiểm tra
                </label>
                <select
                  value={actualStatus}
                  onChange={e => setActualStatus(e.target.value as AssetStatus)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="available">🟢 Sẵn sàng sử dụng (Hoạt động tốt)</option>
                  <option value="in_use">🟡 Đang sử dụng bình thường</option>
                  <option value="alert">🔴 Có vấn đề / Hư hỏng / Cần bảo trì</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ghi chú kiểm tra (vết xước, bụi cảm biến nếu có)
                </label>
                <textarea
                  rows={2}
                  value={scanNotes}
                  onChange={e => setScanNotes(e.target.value)}
                  placeholder="Ghi nhận hiện trạng..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordScanModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  Ghi nhận & Đối soát
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR SCANNER */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRSuccess}
        assets={assets}
      />
    </div>
  );
}
