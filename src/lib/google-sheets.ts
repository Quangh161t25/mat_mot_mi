import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Asset, UserProfile, TransferRecord, AuditItem, AuditSession } from '@/types';

export const SPREADSHEET_ID = 
  process.env.GOOGLE_SHEET_ID || 
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || 
  '10eUWTeN5AmmOkEG4K2gc2DQEF-3PZtSQs1QOtHfiCF4';

/**
 * Clean & normalize PEM private key format
 */
export function normalizePrivateKey(rawKey: string): string {
  let cleanKey = (rawKey || '').trim();
  
  // Strip surrounding quotes if wrapped in "..." or '...'
  if (
    (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
    (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
  ) {
    cleanKey = cleanKey.slice(1, -1);
  }

  // Handle underscore replacements in BEGIN / END headers (crucial if browser/editor autocorrected spaces to underscores)
  cleanKey = cleanKey
    .replace(/BEGIN_PRIVATE_KEY/gi, 'BEGIN PRIVATE KEY')
    .replace(/END_PRIVATE_KEY/gi, 'END PRIVATE KEY')
    .replace(/BEGIN[-_ ]+RSA[-_ ]+PRIVATE[-_ ]+KEY/gi, 'BEGIN RSA PRIVATE KEY')
    .replace(/END[-_ ]+RSA[-_ ]+PRIVATE[-_ ]+KEY/gi, 'END RSA PRIVATE KEY');

  // Handle various newline escapes: \r\n, \r, \\n, \n
  cleanKey = cleanKey
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  return cleanKey;
}

/**
 * Diagnostic helper to detect environment configuration
 */
export function getGoogleAuthDiagnostics() {
  const hasFile = fs.existsSync(path.join(process.cwd(), 'google-service-account.json'));
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_CREDENTIALS;
  const rawEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_KEY;

  return {
    hasFile,
    hasJsonEnv: Boolean(rawJson),
    hasEmailEnv: Boolean(rawEmail),
    hasKeyEnv: Boolean(rawKey),
    sheetId: SPREADSHEET_ID,
  };
}

export function getGoogleAuth() {
  // 1. Check if full JSON is passed via environment variable (best for Vercel)
  const envJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_CREDENTIALS;
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson);
      const email = parsed.client_email || parsed.clientemail;
      const key = normalizePrivateKey(parsed.private_key || parsed.privatekey);
      if (email && key) {
        return new google.auth.JWT({
          email,
          key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
      }
    } catch (err) {
      console.warn('Lỗi phân tích GOOGLE_SERVICE_ACCOUNT_JSON:', err);
    }
  }

  // 2. Check local file (for local development)
  try {
    const credsPath = path.join(process.cwd(), 'google-service-account.json');
    if (fs.existsSync(credsPath)) {
      const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
      const email = creds.client_email || creds.clientemail;
      const key = normalizePrivateKey(creds.private_key || creds.privatekey);
      return new google.auth.JWT({
        email,
        key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }
  } catch (err) {
    console.warn('Lỗi đọc file google-service-account.json:', err);
  }

  // 3. Check individual environment variables (GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_SERVICE_ACCOUNT_KEY)
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || '').trim();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_KEY;

  if (email && rawKey) {
    const key = normalizePrivateKey(rawKey);
    return new google.auth.JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  return null;
}

export function getSheetsClient() {
  const auth = getGoogleAuth();
  if (!auth) return null;
  return google.sheets({ 
    version: 'v4', 
    auth,
    retryConfig: { retry: 0 } // Không retry để tránh bị treo 10s dẫn tới Vercel 504 Timeout
  });
}

// Đường dẫn cache đĩa (trên Vercel dùng /tmp, local dùng thư mục hiện tại)
const CACHE_FILE_PATH = path.join(
  process.env.VERCEL ? '/tmp' : process.cwd(),
  '.sheets-cache.json'
);

function writeDiskCache(data: any): void {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data), 'utf8');
  } catch (e) {}
}

// In-memory cache để tiết kiệm Quota Google Sheets (Google cho phép tối đa 60 read/phút)
let cachedData: {
  assets: Asset[];
  profiles: UserProfile[];
  transfers: TransferRecord[];
  auditItems: AuditItem[];
  auditSessions: AuditSession[];
} | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 5000; // 5 giây cache máy chủ (đủ chống vượt Quota, vẫn gần real-time)

export function getCachedSheetsData() {
  return cachedData;
}

export function invalidateSheetsCache() {
  lastFetchTimestamp = 0;
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      fs.unlinkSync(CACHE_FILE_PATH);
    }
  } catch (e) {}
}

// ==========================================
// 1. ĐỌC TOÀN BỘ DỮ LIỆU TỪ GOOGLE SHEETS (Dùng batchGet - 1 request duy nhất)
// ==========================================
export async function fetchAllFromSheets(forceRefresh = false) {
  const now = Date.now();
  // 1. Ưu tiên trả về Memory Cache nếu còn trong hạn 15s
  if (!forceRefresh && cachedData && (now - lastFetchTimestamp < CACHE_TTL_MS)) {
    return cachedData;
  }

  const sheets = getSheetsClient();
  if (!sheets) {
    const diag = getGoogleAuthDiagnostics();
    throw new Error(
      `Chưa tìm thấy thông tin xác thực Google Service Account. (File: ${diag.hasFile}, JSON Env: ${diag.hasJsonEnv}, Email Env: ${diag.hasEmailEnv}, Key Env: ${diag.hasKeyEnv})`
    );
  }

  try {
    // Giới hạn thời gian gọi Google Sheets tối đa 5 giây (tránh Vercel Serverless Function 10s timeout)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Google Sheets API timeout sau 8s')), 8000)
    );

    // Sử dụng batchGet gộp 4 Sheet thành 1 request duy nhất để không bao giờ vượt Quota của Google
    const batchPromise = sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [
        'THIET_BI!A2:N1000',
        'NHAN_SU!A2:H1000',
        'MUON_TRA!A2:P1000',
        'KIEM_KE!A2:M1000',
      ],
    });

    const batchRes: any = await Promise.race([batchPromise, timeoutPromise]);

    const [assetsRange, staffRange, transfersRange, auditRange] = batchRes.data.valueRanges || [];

    // Parse THIET_BI
    const assets: Asset[] = (assetsRange?.values || [])
      .filter((row: any) => row[0] && row[0].toString().trim() !== '')
      .map((row: any, idx: number) => ({
        id: `ast-${idx + 1}`,
        code: (row[0] || '').toString().trim(),
        name: row[1] || 'Thiết bị',
        category: (row[2] || 'camera') as any,
        model: row[3] || '',
        serial_number: row[4] || '',
        location: row[5] || 'Kho Studio Tầng 1',
        manager_id: 'u-mgr-1',
        manager_name: row[6] || 'Quản lý kho',
        current_holder_id: row[7] ? 'holder-id' : null,
        current_holder_name: row[7] || null,
        status: (row[8] || 'available') as any,
        alert_reason: (row[9] || null) as any,
        due_date: row[10] || null,
        notes: row[11] || '',
        image_url: row[12] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600',
        created_at: row[13] || new Date().toISOString(),
        updated_at: row[13] || new Date().toISOString(),
      }));

    // Parse NHAN_SU
    const profiles: UserProfile[] = (staffRange?.values || [])
      .filter((row: any) => row[0] && row[0].toString().trim() !== '')
      .map((row: any, idx: number) => ({
        id: row[0] || `u-${idx + 1}`,
        full_name: row[1] || 'Nhân sự',
        email: row[2] || 'staff@matmotmi.vn',
        phone: row[3] || '',
        role: (row[4] || 'staff') as any,
        status: (row[5] || 'active') as any,
        avatar_url: row[6] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        created_at: row[7] || new Date().toISOString(),
      }));

    // Parse MUON_TRA
    const transfers: TransferRecord[] = (transfersRange?.values || [])
      .filter((row: any) => row[0] && row[0].toString().trim() !== '')
      .map((row: any, idx: number) => {
        const fromName = row[3] || '';
        const toName = row[4] || '';
        const fromUser = profiles.find(p => p.full_name.trim().toLowerCase() === fromName.trim().toLowerCase() || p.full_name.includes(fromName));
        const toUser = profiles.find(p => p.full_name.trim().toLowerCase() === toName.trim().toLowerCase() || p.full_name.includes(toName));

        return {
          id: row[0] || `tr-${idx + 1}`,
          asset_id: `ast-${row[1]}`,
          asset_code: row[1] || '',
          asset_name: row[2] || '',
          from_user_id: fromUser ? fromUser.id : (fromName ? `u-${fromName}` : 'u-admin-1'),
          from_user_name: fromName,
          to_user_id: toUser ? toUser.id : (toName ? `u-${toName}` : 'u-staff-1'),
          to_user_name: toName,
          transfer_type: (row[5] || 'peer_transfer') as any,
          status: (row[6] || 'completed') as any,
          due_date: row[7] || null,
          location_after: row[8] || 'Kho Studio',
          giver_notes: row[9] || '',
          giver_photos: row[10] ? row[10].split('; ').filter(Boolean) : [],
          receiver_notes: row[11] || '',
          receiver_photos: row[12] ? row[12].split('; ').filter(Boolean) : [],
          created_at: row[13] || new Date().toISOString(),
          confirmed_at: row[14] || null,
          rejection_reason: row[15] || null,
        };
      });

    // Parse KIEM_KE
    const auditItems: AuditItem[] = (auditRange?.values || [])
      .filter((row: any) => row[0] && row[0].toString().trim() !== '')
      .map((row: any, idx: number) => ({
        id: `ai-${idx + 1}`,
        session_id: row[0] || 'aud-session-1',
        asset_id: `ast-${row[2]}`,
        asset_code: row[2] || '',
        asset_name: row[3] || '',
        scanned_at: row[4] || new Date().toISOString(),
        scanned_by_id: 'u-admin-1',
        scanned_by_name: row[5] || 'Nguyễn Hùng (Admin)',
        expected_location: row[6] || 'Kho Studio Tầng 1',
        actual_location: row[7] || 'Kho Studio Tầng 1',
        expected_holder_id: null,
        expected_holder_name: row[8] || 'Kho',
        actual_holder_id: null,
        actual_holder_name: row[9] || 'Kho',
        expected_status: 'available',
        actual_status: (row[10] || 'available') as any,
        has_discrepancy: (row[11] || '').toUpperCase().includes('SAI LỆCH'),
        discrepancy_details: row[12] || '',
        notes: '',
      }));

    // Reconstruct unique auditSessions from KIEM_KE
    const sessionMap = new Map<string, AuditSession>();
    (auditRange?.values || []).forEach((row: any) => {
      const sId = row[0];
      const sTitle = row[1] || 'Đợt kiểm kê thiết bị';
      if (sId && !sessionMap.has(sId)) {
        sessionMap.set(sId, {
          id: sId,
          title: sTitle,
          created_by_id: 'u-admin-1',
          created_by_name: row[5] || 'Nguyễn Hùng (Admin)',
          status: 'in_progress',
          created_at: row[4] || new Date().toISOString(),
        });
      }
    });

    const auditSessions = Array.from(sessionMap.values());

    const result = { assets, profiles, transfers, auditItems, auditSessions };
    cachedData = result;
    lastFetchTimestamp = Date.now();
    writeDiskCache(result);
    return result;
  } catch (err: any) {
    console.warn('Lỗi gọi Google Sheets (Quota hoặc mạng):', err.message);
    // Không trả dữ liệu cũ/dữ liệu mẫu giả làm dữ liệu mới: client sẽ giữ nguyên dữ liệu đang có
    // và thử lại ở nhịp polling sau. (Trước đây trả mock/cache cũ khiến web hiển thị sai và không báo)
    throw err;
  }
}

// ==========================================
// 2. CÁC HÀM THAO TÁC THIẾT BỊ (THIET_BI)
// ==========================================

export async function appendAssetToSheet(asset: Asset) {
  invalidateSheetsCache();
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

  const row = [
    asset.code,
    asset.name,
    asset.category,
    asset.model || '',
    asset.serial_number || '',
    asset.location || 'Kho Studio Tầng 1',
    asset.manager_name || 'Quản lý kho',
    asset.current_holder_name || '',
    asset.status || 'available',
    asset.alert_reason || '',
    asset.due_date || '',
    asset.notes || '',
    asset.image_url || '',
    new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'THIET_BI!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function updateAssetInSheet(code: string, updates: Partial<Asset>) {
  invalidateSheetsCache();
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'THIET_BI!A2:N1000',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(
    r => r[0] && r[0].toString().trim().toUpperCase() === code.trim().toUpperCase()
  );

  if (rowIndex === -1) return;

  const actualRow = rowIndex + 2;
  const existingRow = rows[rowIndex];

  // Merge updates
  const newRow = [
    existingRow[0], // Code
    updates.name !== undefined ? updates.name : existingRow[1],
    updates.category !== undefined ? updates.category : existingRow[2],
    updates.model !== undefined ? updates.model : existingRow[3],
    updates.serial_number !== undefined ? updates.serial_number : existingRow[4],
    updates.location !== undefined ? updates.location : existingRow[5],
    updates.manager_name !== undefined ? updates.manager_name : existingRow[6],
    updates.current_holder_name !== undefined ? (updates.current_holder_name || '') : existingRow[7],
    updates.status !== undefined ? updates.status : existingRow[8],
    updates.alert_reason !== undefined ? (updates.alert_reason || '') : existingRow[9],
    updates.due_date !== undefined ? (updates.due_date || '') : existingRow[10],
    updates.notes !== undefined ? updates.notes : existingRow[11],
    updates.image_url !== undefined ? updates.image_url : existingRow[12],
    new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `THIET_BI!A${actualRow}:N${actualRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newRow] },
  });
}

export async function deleteAssetInSheet(code: string) {
  invalidateSheetsCache();
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'THIET_BI!A2:A1000',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(
    r => r[0] && r[0].toString().trim().toUpperCase() === code.trim().toUpperCase()
  );

  if (rowIndex === -1) return;
  const actualRow = rowIndex + 2;

  // Clear row content
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `THIET_BI!A${actualRow}:N${actualRow}`,
  });
}

// ==========================================
// 3. CÁC HÀM THAO TÁC NHÂN SỰ (NHAN_SU)
// ==========================================

export async function appendStaffToSheet(profile: UserProfile) {
  invalidateSheetsCache();
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

  const row = [
    profile.id,
    profile.full_name,
    profile.email,
    profile.phone || '',
    profile.role,
    profile.status,
    profile.avatar_url || '',
    profile.created_at || new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'NHAN_SU!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function updateStaffInSheet(id: string, updates: Partial<UserProfile>) {
  invalidateSheetsCache();
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'NHAN_SU!A2:H1000',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[0] && r[0].toString().trim() === id.trim());

  if (rowIndex === -1) return;
  const actualRow = rowIndex + 2;
  const existingRow = rows[rowIndex];

  const newRow = [
    existingRow[0],
    updates.full_name !== undefined ? updates.full_name : existingRow[1],
    updates.email !== undefined ? updates.email : existingRow[2],
    updates.phone !== undefined ? updates.phone : existingRow[3],
    updates.role !== undefined ? updates.role : existingRow[4],
    updates.status !== undefined ? updates.status : existingRow[5],
    updates.avatar_url !== undefined ? updates.avatar_url : existingRow[6],
    existingRow[7] || new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `NHAN_SU!A${actualRow}:H${actualRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newRow] },
  });
}

// ==========================================
// 4. CÁC HÀM THAO TÁC MƯỢN TRẢ (MUON_TRA)
// ==========================================

export async function appendTransferToSheet(transfer: TransferRecord) {
  invalidateSheetsCache();
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

  // Sanitize photos to prevent Google Sheets 50,000 character limit
  const giverPhotos = (transfer.giver_photos || [])
    .map((p, i) => (p && (p.startsWith('http://') || p.startsWith('https://'))) ? p : `[Ảnh bàn giao #${i + 1}]`)
    .join('; ');

  const receiverPhotos = (transfer.receiver_photos || [])
    .map((p, i) => (p && (p.startsWith('http://') || p.startsWith('https://'))) ? p : `[Ảnh xác nhận #${i + 1}]`)
    .join('; ');

  const row = [
    transfer.id,
    transfer.asset_code,
    transfer.asset_name,
    transfer.from_user_name,
    transfer.to_user_name,
    transfer.transfer_type,
    transfer.status,
    transfer.due_date || '',
    transfer.location_after || '',
    transfer.giver_notes || '',
    giverPhotos,
    transfer.receiver_notes || '',
    receiverPhotos,
    transfer.created_at,
    transfer.confirmed_at || '',
    transfer.rejection_reason || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MUON_TRA!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function updateTransferInSheet(transferId: string, updates: Partial<TransferRecord>) {
  invalidateSheetsCache();
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MUON_TRA!A2:P1000',
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[0] && r[0].toString().trim() === transferId.trim());

  if (rowIndex === -1) return;
  const actualRow = rowIndex + 2;
  const existingRow = rows[rowIndex];

  const receiverPhotos = updates.receiver_photos !== undefined
    ? updates.receiver_photos.map((p, i) => (p && (p.startsWith('http://') || p.startsWith('https://'))) ? p : `[Ảnh nhận #${i + 1}]`).join('; ')
    : existingRow[12];

  const newRow = [
    existingRow[0],
    existingRow[1],
    existingRow[2],
    existingRow[3],
    existingRow[4],
    existingRow[5],
    updates.status !== undefined ? updates.status : existingRow[6],
    existingRow[7],
    updates.location_after !== undefined ? updates.location_after : existingRow[8],
    existingRow[9],
    existingRow[10],
    updates.receiver_notes !== undefined ? updates.receiver_notes : existingRow[11],
    receiverPhotos,
    existingRow[13],
    updates.confirmed_at !== undefined ? updates.confirmed_at : existingRow[14],
    updates.rejection_reason !== undefined ? updates.rejection_reason : existingRow[15],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `MUON_TRA!A${actualRow}:P${actualRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newRow] },
  });
}

// ==========================================
// 5. CÁC HÀM THAO TÁC KIỂM KÊ (KIEM_KE)
// ==========================================

export async function appendAuditToSheet(item: AuditItem, sessionTitle: string) {
  invalidateSheetsCache();
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

  const row = [
    item.session_id,
    sessionTitle,
    item.asset_code,
    item.asset_name,
    item.scanned_at,
    item.scanned_by_name,
    item.expected_location,
    item.actual_location,
    item.expected_holder_name || 'Kho',
    item.actual_holder_name || 'Kho',
    item.actual_status,
    item.has_discrepancy ? 'CÓ SAI LỆCH' : 'KHỚP',
    item.discrepancy_details || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'KIEM_KE!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}
