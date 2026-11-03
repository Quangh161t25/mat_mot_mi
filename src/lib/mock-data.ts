import { UserProfile, Asset, TransferRecord, AuditSession, AuditItem, AppNotification, ActivityLog } from '@/types';

export const INITIAL_PROFILES: UserProfile[] = [
  { id: '', email: '', full_name: 'Khách', phone: '', role: 'staff', status: 'active', created_at: '' },
];

export const INITIAL_ASSETS: Asset[] = [];

export const INITIAL_TRANSFERS: TransferRecord[] = [];

export const INITIAL_AUDIT_SESSIONS: AuditSession[] = [];

export const INITIAL_AUDIT_ITEMS: AuditItem[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_LOGS: ActivityLog[] = [];
