import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Asset, UserProfile, TransferRecord, AuditItem } from '@/types';

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
  return google.sheets({ version: 'v4', auth });
}

// ==========================================
// 1. ĐỌC TOÀN BỘ DỮ LIỆU TỪ GOOGLE SHEETS
// ==========================================
export async function fetchAllFromSheets() {
  const sheets = getSheetsClient();
  if (!sheets) {
    const diag = getGoogleAuthDiagnostics();
    throw new Error(
      `Chưa tìm thấy thông tin xác thực Google Service Account. (File: ${diag.hasFile}, JSON Env: ${diag.hasJsonEnv}, Email Env: ${diag.hasEmailEnv}, Key Env: ${diag.hasKeyEnv})`
    );
  }

  // Đọc đồng thời cả 4 sheet
  const [assetsRes, staffRes, transfersRes, auditRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'THIET_BI!A2:N1000' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'NHAN_SU!A2:H1000' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'MUON_TRA!A2:P1000' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'KIEM_KE!A2:M1000' }),
  ]);

  // Parse THIET_BI
  const assets: Asset[] = (assetsRes.data.values || [])
    .filter(row => row[0] && row[0].toString().trim() !== '')
    .map((row, idx) => ({
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
  const profiles: UserProfile[] = (staffRes.data.values || [])
    .filter(row => row[0] && row[0].toString().trim() !== '')
    .map((row, idx) => ({
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
  const transfers: TransferRecord[] = (transfersRes.data.values || [])
    .filter(row => row[0] && row[0].toString().trim() !== '')
    .map((row, idx) => ({
      id: row[0] || `tr-${idx + 1}`,
      asset_id: `ast-${row[1]}`,
      asset_code: row[1] || '',
      asset_name: row[2] || '',
      from_user_id: 'from-id',
      from_user_name: row[3] || '',
      to_user_id: 'to-id',
      to_user_name: row[4] || '',
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
    }));

  return { assets, profiles, transfers };
}

// ==========================================
// 2. CÁC HÀM THAO TÁC THIẾT BỊ (THIET_BI)
// ==========================================

export async function appendAssetToSheet(asset: Asset) {
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
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Google Sheets chưa sẵn sàng');

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
    (transfer.giver_photos || []).join('; '),
    transfer.receiver_notes || '',
    (transfer.receiver_photos || []).join('; '),
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
    updates.receiver_photos !== undefined ? updates.receiver_photos.join('; ') : existingRow[12],
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
