'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Bell, 
  X, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Volume2, 
  CheckCheck,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInstallModal: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenInstallModal,
}) => {
  const router = useRouter();
  const { 
    currentUser, 
    notifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    requestPushPermission,
    sendTestNotification 
  } = useApp();

  const [permissionState, setPermissionState] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  // Filter notifications relevant to current user
  const userNotifications = notifications.filter(
    n => n.target_user_id === currentUser.id || n.target_user_id === 'all'
  );

  const handleEnablePush = async () => {
    const success = await requestPushPermission();
    if (success) {
      setPermissionState('granted');
    }
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    onClose();
    if (notif.link) {
      router.push(notif.link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl relative">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Thông Báo Thiết Bị</h3>
              <p className="text-xs text-slate-500">
                Nhận cảnh báo khi có người mượn hoặc bàn giao thiết bị
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Push Notification permission banner */}
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-orange-950">
                {permissionState === 'granted' 
                  ? 'Chuông & Rung điện thoại: ĐÃ BẬT' 
                  : 'Bật thông báo chuông & rung trên điện thoại'}
              </p>
              <p className="text-orange-900/70 text-[11px]">
                {permissionState === 'granted'
                  ? 'Khi có mượn trả, máy sẽ reo chuông và rung thông báo.'
                  : 'Cho phép thông báo để không bỏ lỡ khi đồng nghiệp bàn giao máy.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permissionState !== 'granted' ? (
              <button
                onClick={handleEnablePush}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-sm transition active:scale-95"
              >
                Bật thông báo
              </button>
            ) : (
              <button
                onClick={sendTestNotification}
                className="px-3 py-1.5 bg-white border border-orange-200 text-orange-700 font-bold hover:bg-orange-100 rounded-xl transition flex items-center gap-1 shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Thử chuông</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar: Mark all as read */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">
            Thông báo của bạn ({userNotifications.length})
          </span>
          {unreadNotificationsCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đánh dấu đã đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Notification Items List */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
          {userNotifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Hiện bạn không có thông báo nào mới.</p>
            </div>
          ) : (
            userNotifications.map(notif => {
              const isUnread = !notif.is_read;

              let Icon = Bell;
              let iconStyle = 'bg-slate-100 text-slate-600';
              if (notif.type === 'transfer_request') {
                Icon = ArrowRightLeft;
                iconStyle = 'bg-orange-100 text-orange-600';
              } else if (notif.type === 'transfer_confirmed') {
                Icon = CheckCircle2;
                iconStyle = 'bg-emerald-100 text-emerald-600';
              } else if (notif.type === 'overdue') {
                Icon = AlertTriangle;
                iconStyle = 'bg-rose-100 text-rose-600';
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 text-xs ${
                    isUnread
                      ? 'bg-orange-50/40 border-orange-200 hover:bg-orange-50/70 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${iconStyle}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isUnread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                      {notif.message}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-orange-600 font-bold">
                      <span>Bấm để mở giao dịch ➔</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-orange-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Install PWA Guide Button */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenInstallModal();
            }}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
          >
            <Smartphone className="w-4 h-4" />
            <span>Cài đặt App trên iPhone & Android</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
