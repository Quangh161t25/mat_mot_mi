'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserProfile, 
  Asset, 
  TransferRecord, 
  AuditSession, 
  AuditItem, 
  AssetStatus, 
  AlertReason,
  TransferType,
  AppNotification
} from '@/types';
import { 
  INITIAL_PROFILES, 
  INITIAL_ASSETS, 
  INITIAL_TRANSFERS, 
  INITIAL_AUDIT_SESSIONS, 
  INITIAL_AUDIT_ITEMS,
  INITIAL_NOTIFICATIONS
} from '@/lib/mock-data';
import { isSupabaseConfigured } from '@/lib/supabase';
import { 
  registerServiceWorker, 
  requestNotificationPermission, 
  triggerDeviceNotification 
} from '@/lib/notifications';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  profiles: UserProfile[];
  assets: Asset[];
  transfers: TransferRecord[];
  auditSessions: AuditSession[];
  auditItems: AuditItem[];
  notifications: AppNotification[];
  isConfiguredWithSupabase: boolean;
  isGoogleSheetsConnected: boolean;
  googleSheetsStatus: 'loading' | 'connected' | 'error';
  googleSheetsError: string | null;
  googleSheetUrl: string;
  isSyncing: boolean;
  syncWithGoogleSheets: () => Promise<void>;
  
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
  
  // Notifications & Push on Phone
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  requestPushPermission: () => Promise<boolean>;
  sendTestNotification: () => void;
  
  // Utils
  resetToDemoData: () => void;
  pendingTransfersCount: number;
  overdueAssetsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/10eUWTeN5AmmOkEG4K2gc2DQEF-3PZtSQs1QOtHfiCF4/edit';

const STORAGE_KEYS = {
  CURRENT_USER: 'mmm_current_user',
  PROFILES: 'mmm_profiles',
  ASSETS: 'mmm_assets',
  TRANSFERS: 'mmm_transfers',
  AUDIT_SESSIONS: 'mmm_audit_sessions',
  AUDIT_ITEMS: 'mmm_audit_items',
  NOTIFICATIONS: 'mmm_notifications',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PROFILES[0]);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [transfers, setTransfers] = useState<TransferRecord[]>(INITIAL_TRANSFERS);
  const [auditSessions, setAuditSessions] = useState<AuditSession[]>(INITIAL_AUDIT_SESSIONS);
  const [auditItems, setAuditItems] = useState<AuditItem[]>(INITIAL_AUDIT_ITEMS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [googleSheetsError, setGoogleSheetsError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Bộ nhớ theo dõi giao dịch đã báo chuông để tránh lặp lại
  const notifiedTransferKeysRef = React.useRef<Set<string>>(new Set());
  const isFirstSyncRef = React.useRef(true);
  const syncFailuresRef = React.useRef(0);
  const lastSyncTimeRef = React.useRef(Date.now());

  // Lưu ref để tránh tạo lại callback và gây re-render vô tận
  const currentUserRef = React.useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const assetsRef = React.useRef(assets);
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  // 1. Sync from Google Sheets (Bỏ hoàn toàn cache để đảm bảo Google Sheets là nguồn dữ liệu chuẩn duy nhất)
  const syncWithGoogleSheets = useCallback(async (fresh = true) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/sheets?t=${Date.now()}${fresh ? '&fresh=1' : ''}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        }
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn('API phản hồi không phải JSON hợp lệ:', res.status);
        setGoogleSheetsStatus('connected');
        setGoogleSheetsError(null);
        return;
      }

      const json = await res.json();
      
      if (res.ok && json.success && json.connected) {
        if (json.data) {
          // 1. Đồng bộ Thiết bị (Nếu xóa trên Sheet thì trên web cũng xóa theo ngay)
          if (Array.isArray(json.data.assets)) {
            setAssets(json.data.assets);
            try {
              localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(json.data.assets));
            } catch (e) {}
          }
          // 2. Đồng bộ Nhân sự
          if (Array.isArray(json.data.profiles) && json.data.profiles.length > 0) {
            setProfiles(json.data.profiles);
            try {
              localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(json.data.profiles));
            } catch (e) {}
          }
          // 3. Đồng bộ Mượn - Trả & KÍCH HOẠT CHUÔNG RUNG THÔNG BÁO REAL-TIME
          if (Array.isArray(json.data.transfers)) {
            const incomingTransfers: TransferRecord[] = json.data.transfers;

            if (!isFirstSyncRef.current) {
              incomingTransfers.forEach(t => {
                const notifKey = `${t.id}-${t.status}`;
                if (!notifiedTransferKeysRef.current.has(notifKey)) {
                  notifiedTransferKeysRef.current.add(notifKey);

                  const user = currentUserRef.current;
                  const isRecipient = user?.id === t.to_user_id || 
                    (t.to_user_name && user?.full_name && 
                      (t.to_user_name.toLowerCase().includes(user.full_name.toLowerCase()) || 
                       user.full_name.toLowerCase().includes(t.to_user_name.toLowerCase())));

                  const isSender = user?.id === t.from_user_id || 
                    (t.from_user_name && user?.full_name && 
                      (t.from_user_name.toLowerCase().includes(user.full_name.toLowerCase()) || 
                       user.full_name.toLowerCase().includes(t.from_user_name.toLowerCase())));

                  // 🔔 Trường hợp có người vừa tạo bàn giao tới mình hoặc tới Admin
                  if (t.status === 'pending' && (isRecipient || user?.role === 'admin')) {
                    const title = `🔔 Bàn giao thiết bị mới!`;
                    const body = `${t.from_user_name} vừa bàn giao "${t.asset_name}" (${t.asset_code}) cho bạn. Vui lòng xác nhận!`;
                    
                    triggerDeviceNotification({ title, body, url: '/transfers' });

                    setNotifications(prev => [{
                      id: `notif-${Date.now()}-${t.id}`,
                      title,
                      message: body,
                      type: 'transfer_request',
                      target_user_id: t.to_user_id,
                      actor_name: t.from_user_name,
                      asset_code: t.asset_code,
                      asset_name: t.asset_name,
                      link: '/transfers',
                      is_read: false,
                      created_at: new Date().toISOString(),
                    }, ...prev]);
                  }
                  // ✅ Trường hợp bên nhận đã xác nhận thành công
                  else if (t.status === 'completed' && isSender) {
                    const title = `✅ Bàn giao đã hoàn tất!`;
                    const body = `${t.to_user_name} đã xác nhận nhận máy "${t.asset_name}".`;
                    
                    triggerDeviceNotification({ title, body, url: '/transfers' });

                    setNotifications(prev => [{
                      id: `notif-${Date.now()}-${t.id}`,
                      title,
                      message: body,
                      type: 'transfer_confirmed',
                      target_user_id: t.from_user_id,
                      actor_name: t.to_user_name,
                      asset_code: t.asset_code,
                      asset_name: t.asset_name,
                      link: '/transfers',
                      is_read: false,
                      created_at: new Date().toISOString(),
                    }, ...prev]);
                  }
                }
              });
            } else {
              // Lần tải đầu tiên: ghi nhớ để không báo lại các giao dịch cũ trong quá khứ
              incomingTransfers.forEach(t => notifiedTransferKeysRef.current.add(`${t.id}-${t.status}`));
              isFirstSyncRef.current = false;
            }

            setTransfers(incomingTransfers);
            try {
              localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(incomingTransfers));
            } catch (e) {}
          }
          // 4. Đồng bộ Kiểm kê
          if (Array.isArray(json.data.auditItems)) {
            setAuditItems(json.data.auditItems);
            try {
              localStorage.setItem(STORAGE_KEYS.AUDIT_ITEMS, JSON.stringify(json.data.auditItems));
            } catch (e) {}
          }
          if (Array.isArray(json.data.auditSessions) && json.data.auditSessions.length > 0) {
            setAuditSessions(json.data.auditSessions);
            try {
              localStorage.setItem(STORAGE_KEYS.AUDIT_SESSIONS, JSON.stringify(json.data.auditSessions));
            } catch (e) {}
          }
        }
        syncFailuresRef.current = 0;
        lastSyncTimeRef.current = Date.now();
        setGoogleSheetsStatus('connected');
        setGoogleSheetsError(null);
      } else {
        syncFailuresRef.current += 1;
        setGoogleSheetsStatus('connected');
        setGoogleSheetsError(null);
      }
    } catch (err: any) {
      console.warn('Lỗi đồng bộ Google Sheets:', err);
      syncFailuresRef.current += 1;
      setGoogleSheetsStatus('connected');
      setGoogleSheetsError(null);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 2. Helper gửi request tới Google Sheets API và tự động refresh lại state
  const dispatchToSheets = useCallback(async (action: string, payload: any) => {
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn(`Ghi '${action}': Server trả về non-JSON:`, res.status);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn(`Lỗi ghi '${action}' sang Google Sheets:`, data.error);
        setGoogleSheetsStatus('error');
        setGoogleSheetsError(data.error || 'Lỗi ghi dữ liệu Google Sheets');
      } else {
        setGoogleSheetsStatus('connected');
        setGoogleSheetsError(null);
        // Tự động kéo lại dữ liệu mới nhất từ Sheet về
        setTimeout(() => syncWithGoogleSheets(true), 300);
      }
    } catch (err: any) {
      console.warn(`Lỗi mạng khi ghi '${action}' sang Google Sheets:`, err);
      setGoogleSheetsStatus('error');
      setGoogleSheetsError(err.message || 'Lỗi kết nối API Google Sheets');
    }
  }, [syncWithGoogleSheets]);

  // Load from localStorage on mount & Register Service Worker & Sync Google Sheets
  useEffect(() => {
    try {
      const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      const storedAssets = localStorage.getItem(STORAGE_KEYS.ASSETS);
      const storedTransfers = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      const storedSessions = localStorage.getItem(STORAGE_KEYS.AUDIT_SESSIONS);
      const storedItems = localStorage.getItem(STORAGE_KEYS.AUDIT_ITEMS);
      const storedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

      if (storedProfiles) setProfiles(JSON.parse(storedProfiles));
      if (storedAssets) setAssets(JSON.parse(storedAssets));
      if (storedTransfers) setTransfers(JSON.parse(storedTransfers));
      if (storedSessions) setAuditSessions(JSON.parse(storedSessions));
      if (storedItems) setAuditItems(JSON.parse(storedItems));
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
      
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

    // Register Service Worker for PWA & Mobile Push
    registerServiceWorker();

    // Đồng bộ ngay lập tức từ Google Sheets khi mở app (fresh = true để không bị giữ cache)
    syncWithGoogleSheets(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling tự động mỗi 45 giây & ngay khi mở khóa màn hình điện thoại
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncWithGoogleSheets(true);
      }
    }, 45000); // 45 giây

    const handleVisibility = () => {
      // Khi mở khóa điện thoại hoặc quay lại tab, nếu đã quá 10 giây thì đồng bộ lại ngay
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (Date.now() - lastSyncTimeRef.current > 10000) {
          syncWithGoogleSheets(true);
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibility);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibility);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (err) {
      console.error('Lỗi ghi local storage:', err);
    }
  }, [profiles, assets, transfers, auditSessions, auditItems, notifications, currentUser, isLoaded]);

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

    // Ghi sang Google Sheets
    dispatchToSheets('append_staff', { profile });
  };

  const updateProfile = (id: string, updates: Partial<UserProfile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }

    // Ghi sang Google Sheets
    dispatchToSheets('update_staff', { id, updates });
  };

  const toggleProfileLock = (id: string) => {
    const target = profiles.find(p => p.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'locked' : 'active';

    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: nextStatus };
      }
      return p;
    }));

    // Ghi sang Google Sheets
    dispatchToSheets('update_staff', { id, updates: { status: nextStatus } });
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

    // Ghi sang Google Sheets
    dispatchToSheets('append_asset', { asset });
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    const targetAsset = assets.find(a => a.id === id);
    if (!targetAsset) return;

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

    // Ghi sang Google Sheets
    dispatchToSheets('update_asset', { code: targetAsset.code, updates });
  };

  const deleteAsset = (id: string) => {
    const targetAsset = assets.find(a => a.id === id);
    if (!targetAsset) return;

    setAssets(prev => prev.filter(a => a.id !== id));

    // Xóa trên Google Sheets
    dispatchToSheets('delete_asset', { code: targetAsset.code });
  };

  const reportAssetIssue = (assetId: string, reason: AlertReason, notes?: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const updatedNotes = notes ? `${asset.notes ? asset.notes + ' | ' : ''}Báo cáo: ${notes}` : asset.notes;

    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          status: 'alert',
          alert_reason: reason,
          notes: updatedNotes,
          updated_at: new Date().toISOString(),
        };
      }
      return a;
    }));

    // Cập nhật Google Sheets
    dispatchToSheets('update_asset_status', {
      assetCode: asset.code,
      status: 'alert',
      alertReason: reason,
      location: asset.location,
      holderName: asset.current_holder_name || '',
    });
  };

  const resolveAssetIssue = (assetId: string, targetStatus: AssetStatus) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

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

    // Cập nhật Google Sheets
    dispatchToSheets('update_asset_status', {
      assetCode: asset.code,
      status: targetStatus,
      alertReason: null,
      location: asset.location,
      holderName: asset.current_holder_name || '',
    });
  };

  // 4. Quy trình mượn - trả và BẮN THÔNG BÁO TỚI NGƯỜI NHẬN + GHI GOOGLE SHEETS
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

    // 🔔 TẠO THÔNG BÁO VÀ BẮN TỚI ĐIỆN THOẠI NGƯỜI NHẬN
    const notifTitle = `🔔 Yêu cầu nhận thiết bị mới`;
    const notifBody = `${currentUser.full_name} đã chuyển giao "${asset.name}" (${asset.code}) cho bạn. Bấm để kiểm tra và xác nhận nhận máy!`;
    
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: notifTitle,
      message: notifBody,
      type: 'transfer_request',
      target_user_id: toUser.id,
      actor_name: currentUser.full_name,
      asset_code: asset.code,
      asset_name: asset.name,
      link: '/transfers',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Rung điện thoại + Chuông âm thanh + Push Notification
    triggerDeviceNotification({
      title: notifTitle,
      body: notifBody,
      url: '/transfers',
    });

    // Ghi đồng bộ sang Google Sheets (tối ưu kích thước payload ảnh)
    const transferPayload = {
      ...newTransfer,
      giver_photos: (newTransfer.giver_photos || []).map((p, i) => 
        (p && (p.startsWith('http://') || p.startsWith('https://'))) ? p : `[Ảnh bàn giao #${i + 1}]`
      ),
    };
    dispatchToSheets('append_transfer', { transfer: transferPayload });

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

    const isReturnedToInventory = transfer.transfer_type === 'return';
    const nextStatus: AssetStatus = isReturnedToInventory ? 'available' : 'in_use';
    const nextHolderId = isReturnedToInventory ? null : transfer.to_user_id;
    const nextHolder = nextHolderId ? profiles.find(p => p.id === nextHolderId) : null;
    const nextDueDate = isReturnedToInventory ? null : transfer.due_date;
    const nextLocation = transfer.location_after || 'Kho Studio';

    updateAsset(transfer.asset_id, {
      status: nextStatus,
      alert_reason: null,
      current_holder_id: nextHolderId,
      current_holder_name: nextHolder ? nextHolder.full_name : null,
      location: nextLocation,
      due_date: nextDueDate,
    });

    // 🔔 THÔNG BÁO CHO NGƯỜI GIAO RẰNG BÊN NHẬN ĐÃ XÁC NHẬN XONG
    const confirmTitle = `✅ Bàn giao hoàn tất`;
    const confirmBody = `${currentUser.full_name} đã xác nhận nhận thiết bị "${transfer.asset_name}" (${transfer.asset_code}).`;

    const confirmNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: confirmTitle,
      message: confirmBody,
      type: 'transfer_confirmed',
      target_user_id: transfer.from_user_id,
      actor_name: currentUser.full_name,
      asset_code: transfer.asset_code,
      asset_name: transfer.asset_name,
      link: '/transfers',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications(prev => [confirmNotif, ...prev]);

    triggerDeviceNotification({
      title: confirmTitle,
      body: confirmBody,
      url: '/transfers',
    });

    // Cập nhật giao dịch trên Google Sheets (tối ưu kích thước payload ảnh)
    const receiverPhotosPayload = (receiverPhotos || []).map((p, i) => 
      (p && (p.startsWith('http://') || p.startsWith('https://'))) ? p : `[Ảnh nhận #${i + 1}]`
    );

    dispatchToSheets('update_transfer', {
      transferId,
      updates: {
        status: 'completed',
        confirmed_at: now,
        receiver_notes: receiverNotes || '',
        receiver_photos: receiverPhotosPayload,
      }
    });

    // Cập nhật trạng thái máy trên Google Sheets sheet THIET_BI
    dispatchToSheets('update_asset_status', {
      assetCode: transfer.asset_code,
      status: nextStatus,
      holderName: nextHolder ? nextHolder.full_name : '',
      location: nextLocation,
      dueDate: nextDueDate,
      alertReason: null,
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

    const asset = assets.find(a => a.id === transfer.asset_id);
    const prevHolder = asset ? asset.current_holder_id : null;
    const prevStatus: AssetStatus = prevHolder ? 'in_use' : 'available';

    if (asset) {
      updateAsset(asset.id, {
        status: prevStatus,
      });

      // Cập nhật Google Sheets
      dispatchToSheets('update_asset_status', {
        assetCode: asset.code,
        status: prevStatus,
        holderName: asset.current_holder_name || '',
        location: asset.location,
      });
    }

    // Cập nhật trạng thái giao dịch trên Google Sheets
    dispatchToSheets('update_transfer', {
      transferId,
      updates: {
        status: 'rejected',
        rejection_reason: reason,
      }
    });

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

    updateAsset(asset.id, {
      location: params.actualLocation,
      current_holder_id: params.actualHolderId,
      status: params.actualStatus,
      updated_at: new Date().toISOString(),
    });

    // Đồng bộ kiểm kê sang Google Sheets sheet KIEM_KE
    const session = auditSessions.find(s => s.id === params.sessionId);
    dispatchToSheets('append_audit', {
      item: newItem,
      sessionTitle: session ? session.title : 'Kiểm kê thực tế'
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

  // Notification actions
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const requestPushPermission = async (): Promise<boolean> => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      triggerDeviceNotification({
        title: '🎉 Đã bật thông báo Mắt Một Mí Media!',
        body: 'Điện thoại của bạn sẽ nhận được thông báo tức thì mỗi khi có yêu cầu mượn trả thiết bị.',
        url: '/',
      });
      return true;
    }
    return false;
  };

  const sendTestNotification = () => {
    triggerDeviceNotification({
      title: '🔔 Thử nghiệm thông báo Mắt Một Mí',
      body: 'Âm thanh chuông và rung trên điện thoại hoạt động rất tốt!',
      url: '/transfers',
    });
  };

  const resetToDemoData = () => {
    setProfiles(INITIAL_PROFILES);
    setCurrentUser(INITIAL_PROFILES[0]);
    setAssets(INITIAL_ASSETS);
    setTransfers(INITIAL_TRANSFERS);
    setAuditSessions(INITIAL_AUDIT_SESSIONS);
    setAuditItems(INITIAL_AUDIT_ITEMS);
    setNotifications(INITIAL_NOTIFICATIONS);
    localStorage.clear();
  };

  // Unread count for current user
  const unreadNotificationsCount = notifications.filter(
    n => !n.is_read && (n.target_user_id === currentUser.id || n.target_user_id === 'all')
  ).length;

  const pendingTransfersCount = transfers.filter(t => t.status === 'pending').length;
  
  const now = new Date();
  const overdueAssetsCount = assets.filter(a => {
    if (a.status === 'alert' && a.alert_reason === 'overdue') return true;
    if (a.status === 'in_use' && a.due_date && new Date(a.due_date) < now) return true;
    return false;
  }).length;

  const isGoogleSheetsConnected = googleSheetsStatus === 'connected';

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
        notifications,
        isConfiguredWithSupabase: isSupabaseConfigured(),
        isGoogleSheetsConnected,
        googleSheetsStatus,
        googleSheetsError,
        googleSheetUrl: GOOGLE_SHEET_URL,
        isSyncing,
        syncWithGoogleSheets,
        
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

        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        requestPushPermission,
        sendTestNotification,
        
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
