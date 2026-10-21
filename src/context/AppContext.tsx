'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Asset, 
  TransferRecord, 
  AuditSession, 
  AuditItem, 
  AssetStatus, 
  AlertReason,
  TransferType 
} from '@/types';
import { 
  INITIAL_PROFILES, 
  INITIAL_ASSETS, 
  INITIAL_TRANSFERS, 
  INITIAL_AUDIT_SESSIONS, 
  INITIAL_AUDIT_ITEMS 
} from '@/lib/mock-data';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  profiles: UserProfile[];
  assets: Asset[];
  transfers: TransferRecord[];
  auditSessions: AuditSession[];
  auditItems: AuditItem[];
  isConfiguredWithSupabase: boolean;
  
  // Permissions
  isAdmin: boolean;
  isManager: boolean;
  canManageEquipment: boolean;
  canManageUsers: boolean;
  
  // Staff / User Management
  addProfile: (profile: Omit<UserProfile, 'id' | 'created_at'>) => void;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  toggleProfileLock: (id: string) => void;
  
  // Asset Management
  addAsset: (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  reportAssetIssue: (assetId: string, reason: AlertReason, notes?: string) => void;
  resolveAssetIssue: (assetId: string, targetStatus: AssetStatus) => void;
  
  // Transfer / Borrow - Return Workflow
  initiateTransfer: (data: {
    assetId: string;
    toUserId: string;
    transferType: TransferType;
    dueDate: string | null;
    locationAfter: string;
    giverNotes: string;
    giverPhotos: string[];
  }) => { success: boolean; error?: string };
  
  confirmTransfer: (
    transferId: string, 
    receiverNotes?: string, 
    receiverPhotos?: string[]
  ) => { success: boolean; error?: string };
  
  rejectTransfer: (transferId: string, reason: string) => { success: boolean };
  
  // Audit Management
  createAuditSession: (title: string, notes?: string) => string;
  recordAuditScan: (params: {
    sessionId: string;
    assetCode: string;
    actualLocation: string;
    actualHolderId: string | null;
    actualStatus: AssetStatus;
    notes?: string;
  }) => { success: boolean; item?: AuditItem; error?: string };
  completeAuditSession: (sessionId: string) => void;
  
  // Utils
  resetToDemoData: () => void;
  pendingTransfersCount: number;
  overdueAssetsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'mmm_current_user',
  PROFILES: 'mmm_profiles',
  ASSETS: 'mmm_assets',
  TRANSFERS: 'mmm_transfers',
  AUDIT_SESSIONS: 'mmm_audit_sessions',
  AUDIT_ITEMS: 'mmm_audit_items',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PROFILES[0]);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [transfers, setTransfers] = useState<TransferRecord[]>(INITIAL_TRANSFERS);
  const [auditSessions, setAuditSessions] = useState<AuditSession[]>(INITIAL_AUDIT_SESSIONS);
  const [auditItems, setAuditItems] = useState<AuditItem[]>(INITIAL_AUDIT_ITEMS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      const storedAssets = localStorage.getItem(STORAGE_KEYS.ASSETS);
      const storedTransfers = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      const storedSessions = localStorage.getItem(STORAGE_KEYS.AUDIT_SESSIONS);
      const storedItems = localStorage.getItem(STORAGE_KEYS.AUDIT_ITEMS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

      if (storedProfiles) setProfiles(JSON.parse(storedProfiles));
      if (storedAssets) setAssets(JSON.parse(storedAssets));
      if (storedTransfers) setTransfers(JSON.parse(storedTransfers));
      if (storedSessions) setAuditSessions(JSON.parse(storedSessions));
      if (storedItems) setAuditItems(JSON.parse(storedItems));
      
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const exists = (storedProfiles ? JSON.parse(storedProfiles) : INITIAL_PROFILES)
          .find((p: UserProfile) => p.id === parsed.id);
        if (exists) setCurrentUser(exists);
      }
    } catch (err) {
      console.error('Lỗi đọc local storage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
      localStorage.setItem(STORAGE_KEYS.AUDIT_SESSIONS, JSON.stringify(auditSessions));
      localStorage.setItem(STORAGE_KEYS.AUDIT_ITEMS, JSON.stringify(auditItems));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (err) {
      console.error('Lỗi ghi local storage:', err);
    }
  }, [profiles, assets, transfers, auditSessions, auditItems, currentUser, isLoaded]);

  // Roles check
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canManageEquipment = isAdmin || isManager;
  const canManageUsers = isAdmin;

  // 1. Quản lý nhân sự
  const addProfile = (newProfile: Omit<UserProfile, 'id' | 'created_at'>) => {
    const profile: UserProfile = {
      ...newProfile,
      id: `u-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setProfiles(prev => [profile, ...prev]);
  };

  const updateProfile = (id: string, updates: Partial<UserProfile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const toggleProfileLock = (id: string) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'active' ? 'locked' : 'active';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  // 2. Quản lý tài sản
  const addAsset = (newAsset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => {
    const manager = profiles.find(p => p.id === newAsset.manager_id);
    const holder = newAsset.current_holder_id 
      ? profiles.find(p => p.id === newAsset.current_holder_id) 
      : null;

    const asset: Asset = {
      ...newAsset,
      id: `ast-${Date.now()}`,
      manager_name: manager ? manager.full_name : undefined,
      current_holder_name: holder ? holder.full_name : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setAssets(prev => [asset, ...prev]);
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates, updated_at: new Date().toISOString() };
        if (updates.manager_id) {
          const m = profiles.find(p => p.id === updates.manager_id);
          updated.manager_name = m ? m.full_name : undefined;
        }
        if (updates.current_holder_id !== undefined) {
          const h = updates.current_holder_id ? profiles.find(p => p.id === updates.current_holder_id) : null;
          updated.current_holder_name = h ? h.full_name : null;
        }
        return updated;
      }
      return a;
    }));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const reportAssetIssue = (assetId: string, reason: AlertReason, notes?: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          status: 'alert',
          alert_reason: reason,
          notes: notes ? `${a.notes ? a.notes + ' | ' : ''}Báo cáo: ${notes}` : a.notes,
          updated_at: new Date().toISOString(),
        };
      }
      return a;
    }));
  };

  const resolveAssetIssue = (assetId: string, targetStatus: AssetStatus) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          status: targetStatus,
          alert_reason: null,
          updated_at: new Date().toISOString(),
        };
      }
      return a;
    }));
  };

  // 4. Quy trình mượn - trả và chuyển giao 2 bên
  const initiateTransfer = (data: {
    assetId: string;
    toUserId: string;
    transferType: TransferType;
    dueDate: string | null;
    locationAfter: string;
    giverNotes: string;
    giverPhotos: string[];
  }): { success: boolean; error?: string } => {
    const asset = assets.find(a => a.id === data.assetId);
    if (!asset) return { success: false, error: 'Thiết bị không tồn tại' };

    // Không thể chuyển giao khi thiết bị đang chờ xác nhận khác
    if (asset.status === 'pending_transfer') {
      return { success: false, error: 'Thiết bị này đang trong một giao dịch chờ xác nhận khác!' };
    }

    const toUser = profiles.find(p => p.id === data.toUserId);
    if (!toUser) return { success: false, error: 'Người nhận không tồn tại' };
    if (toUser.status === 'locked') return { success: false, error: 'Tài khoản người nhận đã bị khóa!' };

    const newTransfer: TransferRecord = {
      id: `tr-${Date.now()}`,
      asset_id: asset.id,
      asset_code: asset.code,
      asset_name: asset.name,
      asset_image: asset.image_url,
      from_user_id: currentUser.id,
      from_user_name: currentUser.full_name,
      to_user_id: toUser.id,
      to_user_name: toUser.full_name,
      transfer_type: data.transferType,
      status: 'pending',
      due_date: data.dueDate,
      location_after: data.locationAfter,
      giver_notes: data.giverNotes,
      giver_photos: data.giverPhotos,
      created_at: new Date().toISOString(),
    };

    setTransfers(prev => [newTransfer, ...prev]);

    // Chuyển ngay thiết bị sang trạng thái 🟠 Cam: Chờ xác nhận
    updateAsset(asset.id, {
      status: 'pending_transfer',
      location: data.locationAfter || asset.location,
    });

    return { success: true };
  };

  const confirmTransfer = (
    transferId: string, 
    receiverNotes?: string, 
    receiverPhotos?: string[]
  ): { success: boolean; error?: string } => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return { success: false, error: 'Giao dịch không tồn tại' };
    if (transfer.status !== 'pending') return { success: false, error: 'Giao dịch không ở trạng thái chờ' };

    // Strict rule: Người trả KHÔNG ĐƯỢC tự xác nhận đã nhận lại.
    // Chỉ người nhận (to_user_id) hoặc Quản lý/Admin mới được xác nhận
    const isRecipient = currentUser.id === transfer.to_user_id;
    const isAuthorizedOverride = canManageEquipment;

    if (!isRecipient && !isAuthorizedOverride) {
      return { 
        success: false, 
        error: `Bạn không phải là người nhận (${transfer.to_user_name}) và không có quyền quản lý để xác nhận!` 
      };
    }

    if (currentUser.id === transfer.from_user_id && !isAuthorizedOverride) {
      return {
        success: false,
        error: 'Người giao/trả không được phép tự xác nhận đã nhận lại thiết bị!'
      };
    }

    // Xác nhận giao dịch
    const now = new Date().toISOString();
    setTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        return {
          ...t,
          status: 'completed',
          confirmed_at: now,
          receiver_notes: receiverNotes || '',
          receiver_photos: receiverPhotos || [],
        };
      }
      return t;
    }));

    // Cập nhật trạng thái thiết bị:
    // Nếu là 'return' (trả về kho/quản lý) -> Chuyển thành 🟢 available (Sẵn sàng)
    // Nếu là 'borrow' hoặc 'peer_transfer' sang nhân sự khác -> Chuyển thành 🟡 in_use
    const isReturnedToInventory = transfer.transfer_type === 'return';
    const nextStatus: AssetStatus = isReturnedToInventory ? 'available' : 'in_use';
    const nextHolderId = isReturnedToInventory ? null : transfer.to_user_id;
    const nextHolder = nextHolderId ? profiles.find(p => p.id === nextHolderId) : null;

    updateAsset(transfer.asset_id, {
      status: nextStatus,
      alert_reason: null,
      current_holder_id: nextHolderId,
      current_holder_name: nextHolder ? nextHolder.full_name : null,
      location: transfer.location_after || 'Kho Studio',
      due_date: isReturnedToInventory ? null : transfer.due_date,
    });

    return { success: true };
  };

  const rejectTransfer = (transferId: string, reason: string): { success: boolean } => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return { success: false };

    setTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        return {
          ...t,
          status: 'rejected',
          rejection_reason: reason,
        };
      }
      return t;
    }));

    // Revert asset status: if it had a holder previously, back to in_use, else available
    const asset = assets.find(a => a.id === transfer.asset_id);
    if (asset) {
      const prevHolder = asset.current_holder_id;
      updateAsset(asset.id, {
        status: prevHolder ? 'in_use' : 'available',
      });
    }

    return { success: true };
  };

  // 7. Kiểm kê thực tế
  const createAuditSession = (title: string, notes?: string): string => {
    const newSession: AuditSession = {
      id: `aud-${Date.now()}`,
      title,
      created_by_id: currentUser.id,
      created_by_name: currentUser.full_name,
      status: 'in_progress',
      created_at: new Date().toISOString(),
      notes,
    };
    setAuditSessions(prev => [newSession, ...prev]);
    return newSession.id;
  };

  const recordAuditScan = (params: {
    sessionId: string;
    assetCode: string;
    actualLocation: string;
    actualHolderId: string | null;
    actualStatus: AssetStatus;
    notes?: string;
  }) => {
    const asset = assets.find(a => a.code.toUpperCase() === params.assetCode.toUpperCase());
    if (!asset) return { success: false, error: `Không tìm thấy thiết bị có mã ${params.assetCode}` };

    const actualHolder = params.actualHolderId ? profiles.find(p => p.id === params.actualHolderId) : null;

    // Tự động kiểm tra sai lệch (Discrepancy detection)
    const discrepancyList: string[] = [];
    if (asset.location.trim().toLowerCase() !== params.actualLocation.trim().toLowerCase()) {
      discrepancyList.push(`Sai lệch vị trí (Hệ thống: "${asset.location}", Thực tế: "${params.actualLocation}")`);
    }
    if ((asset.current_holder_id || null) !== (params.actualHolderId || null)) {
      discrepancyList.push(
        `Sai lệch người giữ (Hệ thống: ${asset.current_holder_name || 'Kho'}, Thực tế: ${actualHolder ? actualHolder.full_name : 'Kho'})`
      );
    }
    if (asset.status !== params.actualStatus) {
      discrepancyList.push(`Sai lệch tình trạng (Hệ thống: ${asset.status}, Thực tế: ${params.actualStatus})`);
    }

    const hasDiscrepancy = discrepancyList.length > 0;

    const newItem: AuditItem = {
      id: `ai-${Date.now()}`,
      session_id: params.sessionId,
      asset_id: asset.id,
      asset_code: asset.code,
      asset_name: asset.name,
      scanned_at: new Date().toISOString(),
      scanned_by_id: currentUser.id,
      scanned_by_name: currentUser.full_name,
      expected_holder_id: asset.current_holder_id,
      expected_holder_name: asset.current_holder_name || 'Kho Studio',
      actual_holder_id: params.actualHolderId,
      actual_holder_name: actualHolder ? actualHolder.full_name : 'Kho Studio',
      expected_location: asset.location,
      actual_location: params.actualLocation,
      expected_status: asset.status,
      actual_status: params.actualStatus,
      has_discrepancy: hasDiscrepancy,
      discrepancy_details: hasDiscrepancy ? discrepancyList.join('; ') : undefined,
      notes: params.notes,
    };

    setAuditItems(prev => [newItem, ...prev]);

    // Tự động đồng bộ cập nhật thiết bị nếu người kiểm kê xác nhận
    updateAsset(asset.id, {
      location: params.actualLocation,
      current_holder_id: params.actualHolderId,
      status: params.actualStatus,
      updated_at: new Date().toISOString(),
    });

    return { success: true, item: newItem };
  };

  const completeAuditSession = (sessionId: string) => {
    setAuditSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          status: 'completed',
          completed_at: new Date().toISOString(),
        };
      }
      return s;
    }));
  };

  const resetToDemoData = () => {
    setProfiles(INITIAL_PROFILES);
    setCurrentUser(INITIAL_PROFILES[0]);
    setAssets(INITIAL_ASSETS);
    setTransfers(INITIAL_TRANSFERS);
    setAuditSessions(INITIAL_AUDIT_SESSIONS);
    setAuditItems(INITIAL_AUDIT_ITEMS);
    localStorage.clear();
  };

  // Dashboard calculations
  const pendingTransfersCount = transfers.filter(t => t.status === 'pending').length;
  
  const now = new Date();
  const overdueAssetsCount = assets.filter(a => {
    if (a.status === 'alert' && a.alert_reason === 'overdue') return true;
    if (a.status === 'in_use' && a.due_date && new Date(a.due_date) < now) return true;
    return false;
  }).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        profiles,
        assets,
        transfers,
        auditSessions,
        auditItems,
        isConfiguredWithSupabase: isSupabaseConfigured(),
        
        isAdmin,
        isManager,
        canManageEquipment,
        canManageUsers,
        
        addProfile,
        updateProfile,
        toggleProfileLock,
        
        addAsset,
        updateAsset,
        deleteAsset,
        reportAssetIssue,
        resolveAssetIssue,
        
        initiateTransfer,
        confirmTransfer,
        rejectTransfer,
        
        createAuditSession,
        recordAuditScan,
        completeAuditSession,
        
        resetToDemoData,
        pendingTransfersCount,
        overdueAssetsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
