import { getUserPermissions, UserProfile, TransferRecord } from '@/types';

type Data = { profiles: UserProfile[]; assets: any[]; transfers: TransferRecord[]; [key: string]: any };

export function permittedData(data: Data, user: UserProfile) {
  const p = getUserPermissions(user);
  return {
    assets: p.assets.view ? data.assets : [],
    // A minimal directory is needed to select a receiver, even without staff-directory permission.
    profiles: data.profiles.map(({ password: _password, ...profile }) => {
      if (profile.id === user.id || p.staff.view) return profile;
      return { id: profile.id, full_name: profile.full_name, status: profile.status, avatar_url: profile.avatar_url };
    }),
    transfers: p.transfers.view ? data.transfers : [],
    auditItems: p.audit.view ? data.auditItems : [],
    auditSessions: p.audit.view ? data.auditSessions : [],
    // Historical logs may contain old profile updates, including passwords.
    logs: p.logs.view ? (data.logs || []).map((log: any) => ({ ...log, details: undefined })) : [],
    combos: p.assets.view ? data.combos : [],
    attendance: p.attendance?.view ? (data.attendance || []).filter((r: any) => user.role !== 'staff' || r.user_id === user.id) : [],
  };
}

export function authorizeAction(user: UserProfile, data: Data, action: string, payload: any): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const p = getUserPermissions(user);
  const rules: Record<string, boolean | undefined> = {
    append_asset: p.assets.create, update_asset: p.assets.edit, update_asset_status: p.assets.edit,
    delete_asset: p.assets.delete, batch_delete_assets: p.assets.delete,
    append_staff: p.staff.create, update_staff: p.staff.edit,
    delete_staff: p.staff.delete, batch_delete_staff: p.staff.delete,
    update_permissions: user.role === 'admin',
    append_transfer: p.transfers.create, append_combo_transfer: p.transfers.create,
    update_transfer: p.transfers.edit, delete_transfer: p.transfers.delete, batch_delete_transfers: p.transfers.delete,
    append_combo: p.assets.create, delete_combo: p.assets.delete,
    append_audit: p.audit.create || p.audit.edit, delete_audit_item: p.audit.delete, delete_audit_session: p.audit.delete,
    append_attendance: p.attendance?.create, delete_attendance: p.attendance?.delete,
    append_log: true,
  };
  if (action === 'update_transfer') {
    const transfer = data.transfers.find(t => t.id === payload.transferId);
    if (!transfer) return false;
    const updates = payload.updates;
    const confirmation = updates && Object.keys(updates).every(k => ['status', 'confirmed_at', 'receiver_notes', 'receiver_photos', 'rejection_reason'].includes(k)) &&
      ['completed', 'rejected'].includes(updates.status);
    if (updates && ['completed', 'rejected'].includes(updates.status)) {
      return !!confirmation && transfer.status === 'pending' && transfer.from_user_id !== user.id &&
        (transfer.to_user_id === user.id || (user.role !== 'staff' && !!p.transfers.edit));
    }
  }
  if (!rules[action]) return false;
  if (['append_staff', 'update_staff'].includes(action)) {
    const changes = action === 'append_staff' ? payload.profile : payload.updates;
    if (!changes || typeof changes !== 'object') return false;
    if (changes.role !== undefined && !['admin', 'manager', 'staff'].includes(changes.role)) return false;
    if (changes.status !== undefined && !['active', 'locked'].includes(changes.status)) return false;
    if (user.role !== 'admin' && (changes.permissions !== undefined ||
      (changes.role !== undefined && changes.role !== 'staff') ||
      (action === 'update_staff' && data.profiles.find(p => p.id === payload.id)?.role !== 'staff'))) return false;
  }
  if (['delete_staff', 'batch_delete_staff'].includes(action)) {
    const ids = action === 'delete_staff' ? [payload.id] : payload.ids;
    if (!Array.isArray(ids) || ids.includes(user.id)) return false;
    if (user.role !== 'admin' && ids.some(id => data.profiles.find(p => p.id === id)?.role !== 'staff')) return false;
  }
  if (['append_transfer', 'append_combo_transfer'].includes(action)) {
    const transfers = action === 'append_transfer' ? [payload.transfer] : payload.transfers;
    if (!Array.isArray(transfers) || transfers.length === 0) return false;
    const codes = new Set<string>();
    return transfers.every(t => {
      if (!t || codes.has(t.asset_code)) return false;
      codes.add(t.asset_code);
      const asset = data.assets.find(a => a.code === t.asset_code);
      const receiver = data.profiles.find(p => p.id === t.to_user_id);
      return asset && receiver?.status === 'active' && receiver.id !== user.id &&
        t.from_user_id === user.id && t.status === 'pending' &&
        ['borrow', 'return', 'peer_transfer'].includes(t.transfer_type) &&
        asset.status !== 'pending_transfer' && !data.transfers.some(x => x.asset_code === t.asset_code && x.status === 'pending') &&
        (!asset.current_holder_id || asset.current_holder_id === user.id || (user.role !== 'staff' && p.assets.edit));
    });
  }
  return true;
}
