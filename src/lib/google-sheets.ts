import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Asset, UserProfile, TransferRecord, AuditItem } from '@/types';

export const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '10eUWTeN5AmmOkEG4K2gc2DQEF-3PZtSQs1QOtHfiCF4';

function getGoogleAuth() {
  // If service account key is provided in env or in json file
  try {
    const credsPath = path.join(process.cwd(), 'google-service-account.json');
    if (fs.existsSync(credsPath)) {
      const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
      return new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }
  } catch (err) {
    console.warn('Lỗi đọc google-service-account.json:', err);
  }

  // Fallback to environment variables
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n');

  if (email && key) {
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

// 1. Đọc toàn bộ dữ liệu từ Google Sheets
export async function fetchAllFromSheets() {
  const sheets = getSheetsClient();
  if (!sheets) throw new Error('Chưa cấu hình tài khoản Google Service Account');

  // Fetch all 4 sheets in parallel
  const [assetsRes, staffRes, transfersRes, auditRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'THIET_BI!A2:N1000' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'NHAN_SU!A2:H1000' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'MUON_TRA!A2:P1000' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'KIEM_KE!A2:M1000' }),
  ]);

  // Parse THIET_BI
  const assets: Asset[] = (assetsRes.data.values || []).map((row, idx) => ({
    id: `ast-${idx + 1}`,
    code: row[0] || `MMM-${idx + 1}`,
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
  const profiles: UserProfile[] = (staffRes.data.values || []).map((row, idx) => ({
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
  const transfers: TransferRecord[] = (transfersRes.data.values || []).map((row, idx) => ({
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
    giver_photos: row[10] ? [row[10]] : [],
    receiver_notes: row[11] || '',
    receiver_photos: row[12] ? [row[12]] : [],
    created_at: row[13] || new Date().toISOString(),
    confirmed_at: row[14] || null,
    rejection_reason: row[15] || null,
  }));

  return { assets, profiles, transfers };
}

// 2. Ghi thêm giao dịch mượn trả vào sheet MUON_TRA
export async function appendTransferToSheet(transfer: TransferRecord) {
  const sheets = getSheetsClient();
  if (!sheets) return;

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

// 3. Ghi dòng kiểm kê vào sheet KIEM_KE
export async function appendAuditToSheet(item: AuditItem, sessionTitle: string) {
  const sheets = getSheetsClient();
  if (!sheets) return;

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
