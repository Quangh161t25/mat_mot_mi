import { UserProfile, Asset, TransferRecord, AuditSession, AuditItem, AppNotification } from '@/types';

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'u-admin-1',
    email: 'hung@matmotmi.vn',
    full_name: 'Nguyễn Hùng (Admin)',
    phone: '0901 234 567',
    role: 'admin',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2025-01-01T08:00:00Z',
  },
];

export const INITIAL_ASSETS: Asset[] = [];

export const INITIAL_TRANSFERS: TransferRecord[] = [];

export const INITIAL_AUDIT_SESSIONS: AuditSession[] = [];

export const INITIAL_AUDIT_ITEMS: AuditItem[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
