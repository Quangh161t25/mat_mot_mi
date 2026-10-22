import React from 'react';
import { AssetStatus, AlertReason } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Wrench, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: AssetStatus;
  alertReason?: AlertReason;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  alertReason,
  showIcon = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1 font-semibold',
    md: 'text-xs md:text-sm px-3 py-1 gap-1.5 font-semibold',
    lg: 'text-sm md:text-base px-3.5 py-1.5 gap-2 font-bold',
  };

  if (status === 'available') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm ${sizeClasses[size]}`}>
        {showIcon && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
        🟢 Sẵn sàng sử dụng
      </span>
    );
  }

  if (status === 'in_use') {
    return (
      <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-sm ${sizeClasses[size]}`}>
        {showIcon && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        🟡 Đang có người giữ
      </span>
    );
  }

  if (status === 'pending_transfer') {
    return (
      <span className={`inline-flex items-center rounded-full bg-orange-50 text-orange-800 border border-orange-300 shadow-sm ${sizeClasses[size]}`}>
        {showIcon && <Clock className="w-3.5 h-3.5 animate-spin text-orange-600" />}
        🟠 Chờ xác nhận giao/trả
      </span>
    );
  }

  // status === 'alert' (🔴 Đỏ)
  let reasonText = 'Sự cố cần xử lý';
  let ReasonIcon = AlertTriangle;

  if (alertReason === 'overdue') {
    reasonText = 'Quá hạn trả';
    ReasonIcon = Clock;
  } else if (alertReason === 'damaged') {
    reasonText = 'Hư hỏng / Bảo trì';
    ReasonIcon = Wrench;
  } else if (alertReason === 'lost') {
    reasonText = 'Báo mất';
    ReasonIcon = XCircle;
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-300 shadow-sm ${sizeClasses[size]}`}>
      {showIcon && <ReasonIcon className="w-3.5 h-3.5 text-rose-600" />}
      🔴 {reasonText}
    </span>
  );
};
