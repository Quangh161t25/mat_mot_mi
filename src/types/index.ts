export type UserRole = 'admin' | 'manager' | 'staff';
export type UserStatus = 'active' | 'locked';

export interface CrudPermissions {
  view: boolean;   // Quyền Xem
  create: boolean; // Quyền Thêm
  edit: boolean;   // Quyền Sửa
  delete: boolean; // Quyền Xóa
}

export interface UserPermissions {
  assets: CrudPermissions;     // Thiết bị: xem, thêm, sửa, xóa
  transfers: CrudPermissions;  // Mượn - Trả: xem, thêm, sửa, xóa
  staff: CrudPermissions;      // Nhân sự: xem, thêm, sửa, xóa
  audit: CrudPermissions;      // Kiểm kê: xem, thêm, sửa, xóa
  logs: { view: boolean };     // Nhật ký: xem
}

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<UserRole, UserPermissions> = {
  admin: {
    assets: { view: true, create: true, edit: true, delete: true },
    transfers: { view: true, create: true, edit: true, delete: true },
    staff: { view: true, create: true, edit: true, delete: true },
    audit: { view: true, create: true, edit: true, delete: true },
    logs: { view: true },
  },
  manager: {
    assets: { view: true, create: true, edit: true, delete: true },
    transfers: { view: true, create: true, edit: true, delete: false },
    staff: { view: true, create: false, edit: false, delete: false },
    audit: { view: true, create: true, edit: true, delete: false },
    logs: { view: true },
  },
  staff: {
    assets: { view: true, create: false, edit: false, delete: false },
    transfers: { view: true, create: true, edit: false, delete: false },
    staff: { view: false, create: false, edit: false, delete: false },
    audit: { view: true, create: false, edit: true, delete: false },
    logs: { view: false },
  },
};

export function getUserPermissions(user?: UserProfile | null): UserPermissions {
  if (!user) return DEFAULT_PERMISSIONS_BY_ROLE.staff;
  if (user.role === 'admin') {
    return user.permissions || DEFAULT_PERMISSIONS_BY_ROLE.admin;
  }
  return user.permissions || DEFAULT_PERMISSIONS_BY_ROLE[user.role] || DEFAULT_PERMISSIONS_BY_ROLE.staff;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  permissions?: UserPermissions;
  avatar_url?: string;
  created_at: string;
}

export type AssetCategory = 
  | 'camera' 
  | 'lens' 
  | 'lighting' 
  | 'computer_storage' 
  | 'audio' 
  | 'accessory' 
  | 'gimbal_tripod';

export type AssetStatus = 
  | 'available'       // 🟢 Xanh: Sẵn sàng sử dụng
  | 'in_use'          // 🟡 Vàng: Đang có người giữ
  | 'pending_transfer'// 🟠 Cam: Chờ xác nhận giao nhận hoặc trả
  | 'alert';          // 🔴 Đỏ: Quá hạn, hư hỏng, mất hoặc có vấn đề cần xử lý

export type AlertReason = 'overdue' | 'damaged' | 'lost' | 'maintenance' | null;

export interface Asset {
  id: string;
  code: string; // e.g. MMM-CAM-001
  name: string;
  category: AssetCategory;
  model: string;
  serial_number: string;
  location: string;
  image_url: string;
  manager_id: string; // Người phụ trách thiết bị
  manager_name?: string;
  current_holder_id: string | null; // Người đang giữ thiết bị
  current_holder_name?: string | null;
  status: AssetStatus;
  alert_reason?: AlertReason;
  due_date: string | null; // ISO string
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type TransferType = 'borrow' | 'return' | 'peer_transfer';
export type TransferStatus = 'pending' | 'completed' | 'rejected' | 'cancelled';

export interface TransferRecord {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_image?: string;
  from_user_id: string; // Người giao
  from_user_name: string;
  to_user_id: string;   // Người nhận
  to_user_name: string;
  transfer_type: TransferType;
  status: TransferStatus;
  due_date: string | null;
  location_after: string; // Vị trí sau khi bàn giao
  combo_id?: string | null;
  combo_name?: string | null;
  
  // Tình trạng khi giao
  giver_notes: string;
  giver_photos: string[]; // URLs or base64
  
  // Tình trạng khi nhận
  receiver_notes?: string;
  receiver_photos?: string[];
  
  created_at: string;
  confirmed_at?: string | null;
  rejection_reason?: string | null;
}

export interface EquipmentCombo {
  id: string;
  name: string;
  description?: string;
  asset_ids: string[];
  asset_codes: string[];
  created_by_name?: string;
  created_at: string;
}

export interface AuditSession {
  id: string;
  title: string;
  created_by_id: string;
  created_by_name: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string | null;
  notes?: string;
}

export interface AuditItem {
  id: string;
  session_id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  scanned_at: string;
  scanned_by_id: string;
  scanned_by_name: string;
  
  expected_holder_id: string | null;
  expected_holder_name: string | null;
  actual_holder_id: string | null;
  actual_holder_name: string | null;
  
  expected_location: string;
  actual_location: string;
  
  expected_status: AssetStatus;
  actual_status: AssetStatus;
  
  has_discrepancy: boolean;
  discrepancy_details?: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'transfer_request' | 'transfer_confirmed' | 'overdue' | 'issue';
  target_user_id: string; // ID người nhận thông báo
  actor_name: string;
  asset_code?: string;
  asset_name?: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export type LogAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'batch_delete' 
  | 'transfer_create' 
  | 'transfer_confirm' 
  | 'transfer_reject' 
  | 'issue_report' 
  | 'issue_resolve' 
  | 'audit_scan' 
  | 'audit_session_create'
  | 'login' 
  | 'logout'
  | 'password_change'
  | 'permissions_update'
  | 'combo_create'
  | 'combo_delete'
  | 'combo_transfer';

export type LogModule = 'Thiết bị' | 'Mượn – Trả' | 'Nhân sự' | 'Kiểm kê' | 'Hệ thống' | 'Phân quyền' | 'Combo';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: LogAction;
  module: LogModule;
  summary: string;
  details?: string;
}
