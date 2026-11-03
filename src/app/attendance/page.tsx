'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { AttendanceType, AttendanceRecord } from '@/types';
import { latestAttendance } from '@/lib/attendance';
import { compressImage } from '@/lib/image-utils';
import { 
  Clock, 
  MapPin, 
  Navigation, 
  Camera, 
  RotateCcw, 
  Search, 
  Calendar, 
  Download, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Building2, 
  Sparkles, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function AttendancePage() {
  const { 
    currentUser, 
    profiles, 
    attendance, 
    recordAttendance, 
    deleteAttendance,
    canViewAttendance,
    canCreateAttendance,
    canDeleteAttendance,
    syncWithGoogleSheets,
    isSyncing,
    isAdmin,
    isManager
  } = useApp();

  // Form State
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('check_in');
  const [locationName, setLocationName] = useState('Kho Studio Tầng 1');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // GPS Geolocation State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>('');

  // Image Preview Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Delete confirm modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hàm tự động kích hoạt GPS
  const requestLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMsg('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }

    setGpsStatus('locating');
    setGpsErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy);
        setGpsStatus('success');
      },
      (err) => {
        console.warn('Lỗi lấy GPS:', err.message);
        setGpsStatus('error');
        if (err.code === 1) {
          setGpsErrorMsg('Bạn đã chặn quyền truy cập vị trí. Vui lòng cho phép trình duyệt truy cập GPS trong Cài đặt.');
        } else if (err.code === 2) {
          setGpsErrorMsg('Không thể xác định vị trí hiện tại của thiết bị.');
        } else {
          setGpsErrorMsg('Hết thời gian chờ tín hiệu GPS vệ tinh.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Tự động lấy GPS khi trang được mở
  useEffect(() => {
    requestLocation();
  }, []);

  // Đổi gợi ý tên địa điểm khi thay đổi loại chấm công
  const handleTypeChange = (type: AttendanceType) => {
    setAttendanceType(type);
    if (type === 'check_in' || type === 'check_out') {
      if (!locationName || locationName.toLowerCase().includes('show') || locationName.toLowerCase().includes('tiệc')) {
        setLocationName('Kho Studio Tầng 1');
      }
    } else {
      if (locationName === 'Kho Studio Tầng 1' || !locationName) {
        setLocationName('Show Cưới / Sự Kiện Nhà Hàng');
      }
    }
  };

  // Xử lý nén ảnh chụp check-in
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 1200, 0.8);
      setPhoto(compressed);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Gửi chấm công
  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!canCreateAttendance) {
      alert('Bạn không có quyền thực hiện chấm công.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordAttendance({
        type: attendanceType,
        locationName: locationName.trim() || 'Kho Studio',
        latitude,
        longitude,
        accuracy,
        photoUrl: photo || undefined,
        notes: notes.trim(),
      });

      if (res.success) {
        const typeLabels: Record<AttendanceType, string> = {
          check_in: 'Vào ca (Studio)',
          check_out: 'Tan ca (Studio)',
          show_check_in: 'Có mặt tại show cưới',
          show_check_out: 'Kết thúc show cưới',
        };
        setSubmitSuccess(`Chấm công "${typeLabels[attendanceType]}" thành công! Dữ liệu đã đồng bộ Google Sheets.`);
        setNotes('');
        setPhoto(null);

        // Giữ vị trí GPS nhưng cập nhật lại để lần sau chính xác
        requestLocation();

        setTimeout(() => {
          setSubmitSuccess(null);
        }, 5000);
      } else {
        alert(res.error || 'Có lỗi xảy ra khi chấm công.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCheckout = async (item: AttendanceRecord) => {
    if (isSubmitting || item.user_id !== currentUser.id || !canCreateAttendance) return;
    setIsSubmitting(true);
    try {
      const result = await recordAttendance({
        type: item.type === 'show_check_in' ? 'show_check_out' : 'check_out',
        locationName: item.location_name, latitude, longitude, accuracy,
        photoUrl: photo || undefined, notes: notes.trim(),
      });
      if (result.success) {
        setSubmitSuccess('Đã ra ca và lưu Google Sheets thành công.');
        setPhoto(null); setNotes('');
      } else alert(result.error || 'Không thể ra ca.');
    } finally { setIsSubmitting(false); }
  };

  // Lọc dữ liệu danh sách chấm công
  const filteredRecords = attendance.filter((item) => {
    // 1. Tìm kiếm theo tên nhân viên, địa điểm, ghi chú
    const s = search.toLowerCase();
    const matchSearch = 
      item.user_name.toLowerCase().includes(s) ||
      item.location_name.toLowerCase().includes(s) ||
      (item.notes && item.notes.toLowerCase().includes(s));

    if (!matchSearch) return false;

    // 2. Lọc nhân sự
    if (selectedStaffId !== 'all' && item.user_id !== selectedStaffId) {
      return false;
    }

    // 3. Lọc loại chấm công
    if (selectedType !== 'all' && item.type !== selectedType) {
      return false;
    }

    // 4. Lọc ngày
    const itemDate = new Date(item.timestamp);
    const now = new Date();

    if (customDate) {
      const targetDate = new Date(customDate);
      const isSameDay = 
        itemDate.getFullYear() === targetDate.getFullYear() &&
        itemDate.getMonth() === targetDate.getMonth() &&
        itemDate.getDate() === targetDate.getDate();
      return isSameDay;
    }

    if (dateFilter === 'today') {
      const isToday = 
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate();
      return isToday;
    }

    if (dateFilter === '7days') {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }

    if (dateFilter === 'month') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }

    return true;
  });

  // Thống kê hôm nay
  const todayRecords = attendance.filter((item) => {
    const itemDate = new Date(item.timestamp);
    const now = new Date();
    return (
      itemDate.getFullYear() === now.getFullYear() &&
      itemDate.getMonth() === now.getMonth() &&
      itemDate.getDate() === now.getDate()
    );
  });

  const todayUniqueStaff = new Set(todayRecords.map((r) => r.user_id)).size;
  const todayStudioCheckins = todayRecords.filter((r) => r.type === 'check_in').length;
  const todayShowCheckins = todayRecords.filter((r) => r.type === 'show_check_in').length;

  // Xuất file CSV / Excel với UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('Không có dữ liệu chấm công để xuất file.');
      return;
    }

    const headers = [
      'Mã chấm công',
      'Mã nhân viên',
      'Họ tên nhân viên',
      'Vai trò',
      'Thời gian',
      'Loại chấm công',
      'Địa điểm / Nơi làm việc',
      'Tọa độ GPS (Vĩ độ, Kinh độ)',
      'Link Google Maps',
      'Độ chính xác (mét)',
      'Ghi chú',
    ];

    const typeLabels: Record<AttendanceType, string> = {
      check_in: 'Vào ca (Studio)',
      check_out: 'Tan ca (Studio)',
      show_check_in: 'Có mặt tại show cưới',
      show_check_out: 'Kết thúc show cưới',
    };

    const rows = filteredRecords.map((r) => [
      r.id,
      r.user_id,
      r.user_name,
      r.user_role,
      new Date(r.timestamp).toLocaleString('vi-VN'),
      typeLabels[r.type] || r.type,
      `"${(r.location_name || '').replace(/"/g, '""')}"`,
      r.latitude && r.longitude ? `"${r.latitude}, ${r.longitude}"` : '',
      r.map_url || (r.latitude && r.longitude ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}` : ''),
      r.accuracy ? Math.round(r.accuracy) : '',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Cham_Cong_Mat_Mot_Mi_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAttendanceBadge = (type: AttendanceType) => {
    switch (type) {
      case 'check_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Vào Ca (Studio)
          </span>
        );
      case 'check_out':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Tan Ca (Studio)
          </span>
        );
      case 'show_check_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Có Mặt Tại Show
          </span>
        );
      case 'show_check_out':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Xong Show Cưới
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-600" />
            Chấm Công & Định Vị Đi Show
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ghi nhận thời gian và định vị GPS khi vào ca tại Studio hoặc có mặt tại các show tiệc cưới. Tự động đồng bộ Google Sheets tab <strong>CHAM_CONG</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => syncWithGoogleSheets()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm active:scale-95"
          >
            <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-orange-600' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Xuất Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 font-bold shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button onClick={() => setSubmitSuccess(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards - Overview Hôm Nay */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lượt chấm hôm nay</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{todayRecords.length}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nhân sự có mặt</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{todayUniqueStaff}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vào ca Studio</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">{todayStudioCheckins}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đến Show Cưới</div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">{todayShowCheckins}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Chấm Công (Left/Top) & Danh Sách Tất Cả Mọi Người (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* CỘT TRÁI: FORM CHẤM CÔNG GPS (Chiếm 5/12 cột desktop) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Header Form */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser?.full_name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-orange-500/20 shrink-0"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                    <span>{currentUser?.full_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-orange-100 text-orange-800">
                      {currentUser?.role?.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Chấm công xác thực GPS cá nhân</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitAttendance} className="space-y-4 text-xs sm:text-sm">
              {/* 1. Lựa chọn loại chấm công */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Chọn Loại Chấm Công *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('check_in')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                      attendanceType === 'check_in'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">🟢</span>
                      {attendanceType === 'check_in' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Vào Ca (Studio)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Bắt đầu ngày làm việc</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('check_out')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                      attendanceType === 'check_out'
                        ? 'border-slate-800 bg-slate-100 text-slate-950 font-bold ring-2 ring-slate-800/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">🔴</span>
                      {attendanceType === 'check_out' && <CheckCircle2 className="w-4 h-4 text-slate-800" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Tan Ca (Studio)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Bàn giao máy và về</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('show_check_in')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                      attendanceType === 'show_check_in'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">📷</span>
                      {attendanceType === 'show_check_in' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Đến Show Cưới</div>
                      <div className="text-[10px] text-slate-500 font-normal">Có mặt tại nhà hàng/tiệc</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('show_check_out')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                      attendanceType === 'show_check_out'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">🏁</span>
                      {attendanceType === 'show_check_out' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Xong Show Cưới</div>
                      <div className="text-[10px] text-slate-500 font-normal">Kết thúc tiệc/chụp ảnh</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Trạng thái GPS vệ tinh & Tọa độ */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <Compass className="w-4 h-4 text-orange-600" />
                    <span>2. Vị Trí GPS Thực Tế</span>
                  </div>

                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={gpsStatus === 'locating'}
                    className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-white px-2.5 py-1 rounded-lg border border-orange-200 active:scale-95 transition disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3 h-3 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                    <span>{gpsStatus === 'locating' ? 'Đang dò GPS...' : 'Lấy lại GPS'}</span>
                  </button>
                </div>

                {/* GPS Status Pill */}
                {gpsStatus === 'locating' && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Đang kết nối vệ tinh GPS để lấy tọa độ chuẩn xác...</span>
                  </div>
                )}

                {gpsStatus === 'success' && latitude && longitude && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold">Đã bắt tọa độ GPS:</span>{' '}
                          <span className="font-mono">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                          {accuracy && (
                            <span className="text-[10px] text-emerald-700 ml-1.5">
                              (±{Math.round(accuracy)}m)
                            </span>
                          )}
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Mở Maps</span>
                      </a>
                    </div>
                  </div>
                )}

                {gpsStatus === 'error' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{gpsErrorMsg || 'Không thể lấy tọa độ GPS'}</span>
                    </div>
                    <p className="text-[11px] text-rose-700">
                      Bạn vẫn có thể tiếp tục chấm công bằng cách nhập tên địa điểm/nhà hàng bên dưới.
                    </p>
                  </div>
                )}

                {/* Input Tên địa điểm */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tên địa điểm / Nơi làm việc / Tiệc cưới *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="VD: Kho Studio Tầng 1 hoặc Nhà hàng tiệc cưới White Palace..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Ảnh chụp Check-in (Selfie hoặc sảnh cưới) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-orange-600" />
                    3. Ảnh Chụp Check-in (Tùy chọn)
                  </span>
                  {photo && <span className="text-[11px] text-emerald-600 font-semibold">✓ Đã chụp ảnh</span>}
                </label>

                {photo ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video max-h-48 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="Ảnh check-in" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isCompressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 hover:bg-orange-50/50 flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-orange-600 transition disabled:opacity-50"
                  >
                    {isCompressing ? (
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                    <span className="text-xs font-bold">
                      {isCompressing ? 'Đang nén ảnh...' : 'Bấm để chụp ảnh hiện trường / selfie'}
                    </span>
                    <span className="text-[10px] text-slate-400">Tự động nén nhẹ không lo lag bộ nhớ</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </div>

              {/* 4. Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Ghi Chú Ca Làm Việc / Show (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Chụp tiệc cưới sáng + chiều, làm việc cùng ekip anh Hùng..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !canCreateAttendance}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span>{isSubmitting ? 'Đang ghi nhận vào Sheets...' : 'Xác Nhận Chấm Công Ngay'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CỘT PHẢI: DANH SÁCH CHẤM CÔNG TẤT CẢ MỌI NGƯỜI (7/12 cột) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Danh Sách Chấm Công Tất Cả Mọi Người
                </h3>
                <p className="text-xs text-slate-500">
                  Hiển thị {filteredRecords.length} lượt chấm công phù hợp bộ lọc
                </p>
              </div>

              {/* Quick Date Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => { setDateFilter('today'); setCustomDate(''); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateFilter === 'today' && !customDate ? 'bg-white text-orange-600 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => { setDateFilter('7days'); setCustomDate(''); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateFilter === '7days' && !customDate ? 'bg-white text-orange-600 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => { setDateFilter('month'); setCustomDate(''); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateFilter === 'month' && !customDate ? 'bg-white text-orange-600 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  Tháng này
                </button>
                <button
                  type="button"
                  onClick={() => { setDateFilter('all'); setCustomDate(''); }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateFilter === 'all' && !customDate ? 'bg-white text-orange-600 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  Tất cả
                </button>
              </div>
            </div>

            {/* Filter Inputs Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Search text */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên, địa điểm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>

              {/* Filter Staff */}
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
              >
                <option value="all">Tất cả nhân viên ({profiles.length})</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>

              {/* Filter Type */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
              >
                <option value="all">Tất cả loại chấm công</option>
                <option value="check_in">🟢 Vào ca (Studio)</option>
                <option value="check_out">🔴 Tan ca (Studio)</option>
                <option value="show_check_in">📷 Đến show cưới</option>
                <option value="show_check_out">🏁 Xong show cưới</option>
              </select>
            </div>

            {/* Records List / Cards */}
            <div className="space-y-3 lg:max-h-[680px] lg:overflow-y-auto lg:pr-1">
              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm font-semibold">Chưa có lượt chấm công nào phù hợp</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Thử chọn lại bộ lọc thời gian hoặc nhập thông tin chấm công bên trái.
                  </p>
                </div>
              ) : (
                filteredRecords.map((item) => {
                  const staff = profiles.find((p) => p.id === item.user_id);
                  const avatar = item.user_avatar || staff?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                  const timeFormatted = new Date(item.timestamp).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-slate-300 transition shadow-sm space-y-2.5"
                    >
                      {/* Row 1: Person & Status */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={avatar}
                            alt={item.user_name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm flex flex-wrap items-center gap-1.5">
                              <span>{item.user_name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-mono font-semibold">
                                {item.user_role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {timeFormatted}
                            </div>
                          </div>
                        </div>

                        {/* Badge */}
                        <div className="shrink-0 flex flex-wrap items-center justify-end gap-2">
                          {getAttendanceBadge(item.type)}
                          {canCreateAttendance && item.user_id === currentUser.id && item.type.endsWith('check_in') && latestAttendance(attendance, item.user_id, item.type.startsWith('show_'))?.id === item.id && (
                            <button type="button" disabled={isSubmitting} onClick={() => handleQuickCheckout(item)} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold disabled:opacity-50">{isSubmitting ? 'Đang lưu...' : item.type === 'show_check_in' ? 'Ra show' : 'Ra ca'}</button>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Location & GPS */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>{item.location_name}</span>
                        </div>

                        {/* GPS Coordinates & Google Maps Link */}
                        <div className="flex flex-wrap items-center gap-2">
                          {item.latitude && item.longitude ? (
                            <a
                              href={item.map_url || `https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold shadow-xs transition"
                            >
                              <Navigation className="w-3 h-3 text-orange-600" />
                              <span>Vị trí Maps ({item.latitude.toFixed(4)}, {item.longitude.toFixed(4)})</span>
                              {item.accuracy && (
                                <span className="text-[9px] text-slate-400">±{Math.round(item.accuracy)}m</span>
                              )}
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Không có GPS</span>
                          )}

                          {/* Preview Photo Button */}
                          {item.photo_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(item.photo_url || null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition"
                            >
                              <Camera className="w-3 h-3 text-blue-600" />
                              <span>Xem ảnh</span>
                            </button>
                          )}

                          {/* Delete Record Button (Admin/Manager) */}
                          {canDeleteAttendance && (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(item.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="Xóa bản ghi chấm công này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notes row if present */}
                      {item.notes && (
                        <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-100 italic">
                          &ldquo;{item.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL XEM ẢNH CHECK-IN PHÓNG TO */}
      {/* ======================================================== */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-600" />
                Ảnh Chụp Hiện Trường / Check-in
              </h4>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhotoUrl}
                alt="Phóng to ảnh check-in"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL XÁC NHẬN XÓA BẢN GHI CHẤM CÔNG */}
      {/* ======================================================== */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-base">Xóa Bản Ghi Chấm Công?</h3>
              <p className="text-xs text-slate-500">
                Thao tác này sẽ xóa bản ghi trên ứng dụng và Google Sheets tab CHAM_CONG. Thao tác không thể hoàn tác.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAttendance(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}