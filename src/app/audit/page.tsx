'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { QRScannerModal } from '@/components/QRScannerModal';
import { AssetStatus, AuditItem, AuditSession } from '@/types';
import { 
  ClipboardCheck, 
  Plus, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Printer, 
  Boxes,
  Check, 
  X,
  Pencil,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  User,
  MapPin,
  Calendar,
  ShieldCheck
} from 'lucide-react';

export default function AuditPage() {
  const { 
    auditSessions, 
    auditItems, 
    assets, 
    profiles, 
    currentUser, 
    canViewAudit,
    canCreateAudit,
    canEditAudit,
    canDeleteAudit,
    createAuditSession, 
    updateAuditSession,
    deleteAuditSession,
    recordAuditScan, 
    deleteAuditItem,
    batchDeleteAuditItems
  } = useApp();

  const [activeSessionId, setActiveSessionId] = useState<string>(
    auditSessions[0]?.id || ''
  );

  // Modals
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRecordScanModalOpen, setIsRecordScanModalOpen] = useState(false);
  const [viewingAuditItem, setViewingAuditItem] = useState<AuditItem | null>(null);
  const [editingSession, setEditingSession] = useState<AuditSession | null>(null);

  // Selection for Batch Delete
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // New session state
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit session state
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [editSessionNotes, setEditSessionNotes] = useState('');

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

  const handleOpenEditSession = (s: AuditSession) => {
    setEditingSession(s);
    setEditSessionTitle(s.title);
    setEditSessionNotes(s.notes || '');
  };

  const handleSaveEditSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    updateAuditSession(editingSession.id, {
      title: editSessionTitle.trim(),
      notes: editSessionNotes.trim(),
    });
    setEditingSession(null);
  };

  const handleDeleteSession = (s: AuditSession) => {
    if (confirm(`Bạn có chắc chắn muốn XÓA đợt kiểm kê "${s.title}" và toàn bộ dữ liệu quét kèm theo?`)) {
      deleteAuditSession(s.id);
      if (activeSessionId === s.id) {
        const remaining = auditSessions.filter(item => item.id !== s.id);
        if (remaining.length > 0) setActiveSessionId(remaining[0].id);
      }
    }
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

  const handleDeleteSingleItem = (item: AuditItem) => {
    if (confirm(`Bạn có chắc chắn muốn XÓA lượt quét của thiết bị "${item.asset_name}" (${item.asset_code})?`)) {
      deleteAuditItem(item.id);
      setSelectedItemIds(prev => prev.filter(id => id !== item.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllItems = () => {
    if (selectedItemIds.length === sessionItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(sessionItems.map(i => i.id));
    }
  };

  const handleBatchDeleteItems = () => {
    if (selectedItemIds.length === 0) return;
    if (confirm(`Bạn có chắc muốn XÓA ${selectedItemIds.length} dòng kiểm kê đã chọn?`)) {
      batchDeleteAuditItems(selectedItemIds);
      setSelectedItemIds([]);
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

  if (!canViewAudit) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Không có quyền xem Kiểm Kê</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Tài khoản của bạn chưa được cấp quyền Xem mô-đun Kiểm Kê Tài Sản. Vui lòng liên hệ Admin để được phân quyền.
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-orange-600" />
            Kiểm Kê Tài Sản & Đối Soát Thực Tế
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quét QR kiểm tra thực tế, xem chi tiết đối soát, chỉnh sửa thông tin và xóa đợt kiểm kê
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canCreateAudit && (
            <button
              onClick={() => setIsNewSessionModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <span>Tạo Đợt Kiểm Kê</span>
            </button>
          )}

          {canEditAudit && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Quét QR Kiểm Kê</span>
            </button>
          )}
        </div>
      </div>

      {/* Session Selector & Stats Bar */}
      {currentSession && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-orange-700 uppercase bg-orange-50 px-2 py-0.5 rounded">
                  Đợt kiểm kê hiện tại
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentSession.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentSession.status === 'in_progress' ? 'Đang thực hiện' : 'Đã hoàn tất'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>{currentSession.title}</span>
                {canEditAudit && (
                  <button
                    onClick={() => handleOpenEditSession(currentSession)}
                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="Sửa tên đợt kiểm kê"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {canDeleteAudit && (
                  <button
                    onClick={() => handleDeleteSession(currentSession)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Xóa đợt kiểm kê này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Khởi tạo bởi {currentSession.created_by_name} • Ngày {new Date(currentSession.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>

            {/* Session actions */}
            <div className="flex items-center gap-2">
              <select
                value={currentSession.id}
                onChange={e => setActiveSessionId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
              >
                {auditSessions.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
                title="Xuất file Excel CSV"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Xuất CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
                title="In báo cáo"
              >
                <Printer className="w-4 h-4 text-orange-600" />
                <span className="hidden sm:inline">In Báo Cáo</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Tổng thiết bị đã quét:</span>
              <strong className="text-lg font-bold text-slate-900">{sessionItems.length}</strong>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block font-medium">Khớp chuẩn:</span>
              <strong className="text-lg font-bold text-emerald-800">
                {sessionItems.length - discrepancyItems.length}
              </strong>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-rose-700 block font-medium">Có sai lệch:</span>
              <strong className="text-lg font-bold text-rose-800">
                {discrepancyItems.length}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Tiến độ kiểm kho:</span>
              <strong className="text-lg font-bold text-orange-600">
                {assets.length > 0 ? Math.round((sessionItems.length / assets.length) * 100) : 0}%
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Items List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Chi Tiết Thiết Bị Đã Quét ({sessionItems.length})
            </h3>
            {canDeleteAudit && sessionItems.length > 0 && (
              <button
                onClick={handleSelectAllItems}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition ml-2"
              >
                {selectedItemIds.length > 0 && selectedItemIds.length === sessionItems.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-orange-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Chọn tất cả</span>
              </button>
            )}
          </div>

          {canDeleteAudit && selectedItemIds.length > 0 && (
            <button
              onClick={handleBatchDeleteItems}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-600/30 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa {selectedItemIds.length} dòng đã chọn</span>
            </button>
          )}
        </div>

        {sessionItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Chưa có thiết bị nào được quét trong đợt này. Bấm &quot;Quét QR Kiểm Kê&quot; để bắt đầu.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessionItems.map(item => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition rounded-xl px-2 ${
                    isSelected ? 'bg-orange-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {canDeleteAudit && (
                      <button
                        onClick={() => handleToggleSelectItem(item.id)}
                        className="mt-0.5 p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-[11px]">
                          {item.asset_code}
                        </span>
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {item.asset_name}
                        </span>
                        {item.has_discrepancy ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1 shrink-0">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Sai lệch
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Khớp chính xác
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-slate-600 text-[11px]">
                        <span>Vị trí thực tế: <strong className="text-slate-900">{item.actual_location}</strong></span>
                        <span>•</span>
                        <span>Người giữ: <strong className="text-slate-900">{item.actual_holder_name}</strong></span>
                        <span>•</span>
                        <span>Quét lúc: {new Date(item.scanned_at).toLocaleTimeString('vi-VN')}</span>
                      </div>

                      {item.discrepancy_details && (
                        <div className="text-rose-700 text-[11px] font-semibold">
                          {item.discrepancy_details}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    <button
                      onClick={() => setViewingAuditItem(item)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                      title="Xem chi tiết đối soát"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Chi tiết</span>
                    </button>

                    {canDeleteAudit && (
                      <button
                        onClick={() => handleDeleteSingleItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa dòng kiểm kê này"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW AUDIT ITEM DETAIL MODAL */}
      {viewingAuditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-orange-600" />
                Đối Soát Kiểm Kê Chi Tiết
              </h3>
              <button
                onClick={() => setViewingAuditItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-mono text-xs font-bold text-orange-700">{viewingAuditItem.asset_code}</span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{viewingAuditItem.asset_name}</h4>
                <div className="text-slate-500 mt-1">
                  Quét bởi <strong>{viewingAuditItem.scanned_by_name}</strong> lúc {new Date(viewingAuditItem.scanned_at).toLocaleString('vi-VN')}
                </div>
              </div>

              {/* Discrepancy comparison */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
                  <div className="font-bold text-slate-700 mb-1">Vị trí:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>Hệ thống: <strong className="text-slate-800">{viewingAuditItem.expected_location}</strong></div>
                    <div>Thực tế: <strong className="text-blue-700">{viewingAuditItem.actual_location}</strong></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
                  <div className="font-bold text-slate-700 mb-1">Người đang giữ:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>Hệ thống: <strong className="text-slate-800">{viewingAuditItem.expected_holder_name || 'Kho'}</strong></div>
                    <div>Thực tế: <strong className="text-amber-800">{viewingAuditItem.actual_holder_name || 'Kho'}</strong></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
                  <div className="font-bold text-slate-700 mb-1">Tình trạng máy:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>Hệ thống: <strong className="text-slate-800">{viewingAuditItem.expected_status}</strong></div>
                    <div>Thực tế: <strong className="text-slate-800">{viewingAuditItem.actual_status}</strong></div>
                  </div>
                </div>
              </div>

              {viewingAuditItem.discrepancy_details && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="font-bold block mb-0.5">Chi tiết sai lệch ghi nhận:</span>
                  <span>{viewingAuditItem.discrepancy_details}</span>
                </div>
              )}

              {viewingAuditItem.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                  <span className="font-bold block mb-0.5">Ghi chú lúc quét:</span>
                  <span>{viewingAuditItem.notes}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingAuditItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT AUDIT SESSION MODAL */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                Sửa Đợt Kiểm Kê
              </h3>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên đợt kiểm kê <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editSessionTitle}
                  onChange={e => setEditSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  value={editSessionNotes}
                  onChange={e => setEditSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
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

      {/* CREATE NEW AUDIT SESSION MODAL */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-600" />
                Tạo Đợt Kiểm Kê Mới
              </h3>
              <button
                onClick={() => setIsNewSessionModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên đợt kiểm kê <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="VD: Kiểm kê tổng kết cuối tuần hoặc Show Cưới Hạ Long"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mục đích / Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Kiểm kê toàn bộ body máy, lens và đèn tại kho trước mùa cưới cao điểm..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  Bắt đầu đợt kiểm kê
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD SCAN RESULTS MODAL */}
      {isRecordScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-600" />
                Ghi Nhận Kết Quả Quét QR
              </h3>
              <button
                onClick={() => setIsRecordScanModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAuditScan} className="p-5 space-y-4">
              {scanResultAlert && (
                <div className={`p-3 rounded-2xl flex items-start gap-2.5 ${
                  scanResultAlert.hasDiscrepancy 
                    ? 'bg-rose-50 border border-rose-200 text-rose-800' 
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}>
                  {scanResultAlert.hasDiscrepancy ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <h5 className="font-bold">
                      {scanResultAlert.hasDiscrepancy ? 'Đã phát hiện sai lệch thực tế!' : 'Thông tin khớp hoàn toàn!'}
                    </h5>
                    {scanResultAlert.details && (
                      <p className="text-[11px] mt-0.5">{scanResultAlert.details}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mã thiết bị đã quét
                </label>
                <input
                  type="text"
                  required
                  value={scannedCode}
                  onChange={e => setScannedCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-orange-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vị trí thực tế ghi nhận
                </label>
                <input
                  type="text"
                  required
                  value={actualLocation}
                  onChange={e => setActualLocation(e.target.value)}
                  placeholder="VD: Kho Studio Tầng 1, Bàn Kỹ Thuật..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Người đang giữ thực tế
                </label>
                <select
                  value={actualHolderId}
                  onChange={e => setActualHolderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  <option value="">(Trong Kho - Chưa ai giữ)</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tình trạng máy móc thực tế
                </label>
                <select
                  value={actualStatus}
                  onChange={e => setActualStatus(e.target.value as AssetStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500 font-bold"
                >
                  <option value="available">🟢 Sẵn sàng tốt</option>
                  <option value="in_use">🟡 Đang sử dụng</option>
                  <option value="alert">🔴 Có lỗi hỏng hóc / Cần kiểm tra</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú kiểm tra
                </label>
                <textarea
                  rows={2}
                  value={scanNotes}
                  onChange={e => setScanNotes(e.target.value)}
                  placeholder="VD: Cảm biến sạch, pin đầy, không trầy xước..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordScanModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  Lưu & Đối soát
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRSuccess}
        assets={assets}
      />
    </div>
  );
}
