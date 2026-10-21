export type UserRole = 'admin' | 'manager' | 'staff';
export type UserStatus = 'active' | 'locked';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
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
