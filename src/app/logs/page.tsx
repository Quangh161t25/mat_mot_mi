'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ActivityLog, LogModule, LogAction } from '@/types';
import { 
  History, 
  Search, 
  Filter, 
  RotateCcw, 
  User, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  Boxes, 
  ArrowRightLeft, 
  Users as UsersIcon, 
  ClipboardCheck, 
  FileText,
  Clock,
  Eye,
  X
} from 'lucide-react';

const MODULES: { id: LogModule | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả module' },
  { id: 'Thiết bị', label: 'Thiết bị' },
  { id: 'Mượn – Trả', label: 'Mượn – Trả' },
  { id: 'Nhân sự', label: 'Nhân sự' },
  { id: 'Kiểm kê', label: 'Kiểm kê' },
  { id: 'Hệ thống', label: 'Hệ thống' },
];

export default function LogsPage() {
  const { logs, syncWithGoogleSheets, isSyncing, canViewLogs } = useApp();

  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesSearch = 
      log.summary.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
      log.id.toLowerCase().includes(search.toLowerCase());

    return matchesModule && matchesAction && matchesSearch;
  });

  const getModuleBadgeColor = (module: LogModule) => {
    switch (module) {
      case 'Thiết bị': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Mượn – Trả': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Nhân sự': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Kiểm kê': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Hệ thống': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getActionBadge = (action: LogAction) => {
    switch (action) {
      case 'create':
      case 'transfer_create':
      case 'audit_session_create':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Tạo mới</span>;
      case 'update':
      case 'password_change':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Chỉnh sửa</span>;
      case 'delete':
      case 'batch_delete':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Xóa</span>;
      case 'transfer_confirm':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Xác nhận</span>;
      case 'transfer_reject':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Từ chối</span>;
      case 'login':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Đăng nhập</span>;
      case 'logout':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Đăng xuất</span>;
      case 'audit_scan':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Quét kiểm kê</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{action}</span>;
    }
  };

  if (!canViewLogs) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Không có quyền xem Nhật Ký</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Tài khoản của bạn chưa được cấp quyền Xem mô-đun Nhật Ký Hoạt Động (Audit Trail). Vui lòng liên hệ Admin để được phân quyền.
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
            <History className="w-6 h-6 text-orange-600" />
            Nhật Ký Hoạt Động & Thay Đổi (Audit Trail)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ghi lại toàn bộ hành vi thêm, sửa, xóa, bàn giao, xác nhận, kiểm kê và đăng nhập. Tự động đồng bộ lên Google Sheets sheet NHAT_KY.
          </p>
        </div>

        <button
          onClick={() => syncWithGoogleSheets()}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm active:scale-95"
        >
          <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-orange-600' : ''}`} />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Tổng số hoạt động</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{logs.length}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Thiết bị & Mượn trả</div>
          <div className="text-2xl font-black text-orange-600 mt-1">
            {logs.filter(l => l.module === 'Thiết bị' || l.module === 'Mượn – Trả').length}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Nhân sự & Phân quyền</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {logs.filter(l => l.module === 'Nhân sự' || l.module === 'Hệ thống').length}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Kiểm kê thực tế</div>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {logs.filter(l => l.module === 'Kiểm kê').length}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo nội dung, tên người làm, chi tiết..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-orange-500 font-medium w-full sm:w-auto"
            >
              {MODULES.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Chưa có nhật ký hoạt động nào phù hợp.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Hành động</th>
                  <th className="py-3 px-4">Nội dung</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.user_name}</div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        log.user_role === 'admin' ? 'bg-rose-100 text-rose-700 font-bold' :
                        log.user_role === 'manager' ? 'bg-amber-100 text-amber-800 font-bold' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getModuleBadgeColor(log.module)}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="line-clamp-2">{log.summary}</div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 rounded-lg text-xs font-semibold transition flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Chi Tiết Nhật Ký Hoạt Động
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã log:</span>
                  <strong className="font-mono text-slate-800">{selectedLog.id}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thời gian:</span>
                  <strong className="text-slate-800">{new Date(selectedLog.timestamp).toLocaleString('vi-VN')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người thực hiện:</span>
                  <strong className="text-slate-800">{selectedLog.user_name} ({selectedLog.user_role})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Module & Hành động:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-slate-800">{selectedLog.module}</span>
                    <span>•</span>
                    {getActionBadge(selectedLog.action)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Nội dung tóm tắt:</h4>
                <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 font-medium">
                  {selectedLog.summary}
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Dữ liệu chi tiết:</h4>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-60">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                      } catch {
                        return selectedLog.details;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
