import { NextResponse } from 'next/server';
import { 
  fetchAllFromSheets, 
  getCachedSheetsData,
  appendAssetToSheet,
  updateAssetInSheet,
  deleteAssetInSheet,
  appendStaffToSheet,
  updateStaffInSheet,
  appendTransferToSheet, 
  updateTransferInSheet,
  appendAuditToSheet, 
  SPREADSHEET_ID, 
  getSheetsClient,
  getGoogleAuthDiagnostics
} from '@/lib/google-sheets';

// Cấu hình không cache và timeout 30s cho Vercel Serverless
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 30;

const corsAndNoCacheHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Pragma, Cache-Control',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsAndNoCacheHeaders,
  });
}

// Cho phép CDN của Vercel dùng chung 1 phản hồi cho MỌI người dùng/thiết bị trong 60s.
const sharedCdnCacheHeaders = {
  ...corsAndNoCacheHeaders,
  'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180',
  'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180',
};

export async function GET(req: Request) {
  const diag = getGoogleAuthDiagnostics();
  // ?fresh=... dùng ngay sau khi ghi dữ liệu để bỏ qua cache và thấy thay đổi tức thì
  const forceRefresh = new URL(req.url).searchParams.has('fresh');
  try {
    const data = await fetchAllFromSheets(forceRefresh);
    return NextResponse.json({
      success: true,
      connected: true,
      spreadsheetId: SPREADSHEET_ID,
      diagnostics: diag,
      data,
    }, {
      headers: forceRefresh ? corsAndNoCacheHeaders : sharedCdnCacheHeaders
    });
  } catch (err: any) {
    console.error('API Google Sheets GET error:', err);
    // Google báo vượt Quota: trả dữ liệu thật gần nhất trong RAM hoặc Disk thay vì báo lỗi
    const stale = getCachedSheetsData();
    if (stale) {
      return NextResponse.json({
        success: true,
        connected: true,
        stale: true,
        spreadsheetId: SPREADSHEET_ID,
        diagnostics: diag,
        data: stale,
      }, { headers: corsAndNoCacheHeaders });
    }

    const isQuota = err.message && (err.message.includes('Quota exceeded') || err.message.includes('rateLimitExceeded'));
    if (isQuota) {
      return NextResponse.json({
        success: true,
        connected: true,
        isQuotaThrottled: true,
        spreadsheetId: SPREADSHEET_ID,
        diagnostics: diag,
        data: null,
        warning: 'Google Sheets tạm bận Quota, ứng dụng tiếp tục chạy bình thường với dữ liệu sẵn có.',
      }, { 
        status: 200,
        headers: corsAndNoCacheHeaders
      });
    }

    // Luôn trả về 200 để client frontend không bao giờ bị ném lỗi Failed to fetch
    return NextResponse.json({
      success: false,
      connected: false,
      spreadsheetId: SPREADSHEET_ID,
      diagnostics: diag,
      error: err.message || 'Lỗi đọc dữ liệu Google Sheets',
    }, { 
      status: 200,
      headers: corsAndNoCacheHeaders
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    const sheets = getSheetsClient();
    if (!sheets) {
      const diag = getGoogleAuthDiagnostics();
      return NextResponse.json({ 
        success: false, 
        diagnostics: diag,
        error: 'Google Sheets chưa sẵn sàng. Vui lòng kiểm tra biến môi trường trên Vercel.' 
      }, { 
        status: 500,
        headers: corsAndNoCacheHeaders
      });
    }

    switch (action) {
      // 1. Quản lý thiết bị
      case 'append_asset':
        await appendAssetToSheet(payload.asset);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'update_asset':
        await updateAssetInSheet(payload.code, payload.updates);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'delete_asset':
        await deleteAssetInSheet(payload.code);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      // 2. Quản lý nhân sự
      case 'append_staff':
        await appendStaffToSheet(payload.profile);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'update_staff':
        await updateStaffInSheet(payload.id, payload.updates);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      // 3. Mượn trả
      case 'append_transfer':
        await appendTransferToSheet(payload.transfer);
        await updateAssetInSheet(payload.transfer.asset_code, {
          status: 'pending_transfer',
          location: payload.transfer.location_after || undefined,
        });
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'update_transfer':
        await updateTransferInSheet(payload.transferId, payload.updates);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      // Cập nhật trạng thái thiết bị sau khi bàn giao xong hoặc xử lý sự cố
      case 'update_asset_status':
        await updateAssetInSheet(payload.assetCode, {
          status: payload.status,
          current_holder_name: payload.holderName,
          location: payload.location,
          due_date: payload.dueDate || null,
          alert_reason: payload.alertReason || null,
        });
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      // 4. Kiểm kê
      case 'append_audit':
        await appendAuditToSheet(payload.item, payload.sessionTitle || 'Kiểm kê');
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      default:
        return NextResponse.json({ 
          success: false, 
          error: `Action '${action}' không được hỗ trợ` 
        }, { 
          status: 400,
          headers: corsAndNoCacheHeaders
        });
    }
  } catch (err: any) {
    console.error('API Google Sheets POST error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Lỗi ghi dữ liệu Google Sheets',
    }, { 
      status: 500,
      headers: corsAndNoCacheHeaders
    });
  }
}
