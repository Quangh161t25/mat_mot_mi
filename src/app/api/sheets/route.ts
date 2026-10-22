import { NextResponse } from 'next/server';
import { 
  fetchAllFromSheets, 
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

export async function GET() {
  try {
    const diag = getGoogleAuthDiagnostics();
    const sheets = getSheetsClient();
    
    if (!sheets) {
      return NextResponse.json({
        success: false,
        connected: false,
        spreadsheetId: SPREADSHEET_ID,
        diagnostics: diag,
        error: 'Chưa cấu hình tài khoản Google Service Account trên server/Vercel.',
      }, { status: 200 }); // Return 200 with connected: false so client can handle gracefully
    }

    const data = await fetchAllFromSheets();
    return NextResponse.json({
      success: true,
      connected: true,
      spreadsheetId: SPREADSHEET_ID,
      diagnostics: diag,
      data,
    });
  } catch (err: any) {
    console.error('API Google Sheets GET error:', err);
    const diag = getGoogleAuthDiagnostics();
    return NextResponse.json({
      success: false,
      connected: false,
      spreadsheetId: SPREADSHEET_ID,
      diagnostics: diag,
      error: err.message || 'Lỗi đọc dữ liệu Google Sheets',
    }, { status: 500 });
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
      }, { status: 500 });
    }

    switch (action) {
      // 1. Quản lý thiết bị
      case 'append_asset':
        await appendAssetToSheet(payload.asset);
        return NextResponse.json({ success: true });

      case 'update_asset':
        await updateAssetInSheet(payload.code, payload.updates);
        return NextResponse.json({ success: true });

      case 'delete_asset':
        await deleteAssetInSheet(payload.code);
        return NextResponse.json({ success: true });

      // 2. Quản lý nhân sự
      case 'append_staff':
        await appendStaffToSheet(payload.profile);
        return NextResponse.json({ success: true });

      case 'update_staff':
        await updateStaffInSheet(payload.id, payload.updates);
        return NextResponse.json({ success: true });

      // 3. Mượn trả
      case 'append_transfer':
        await appendTransferToSheet(payload.transfer);
        // Đồng thời cập nhật trạng thái thiết bị sang pending_transfer
        await updateAssetInSheet(payload.transfer.asset_code, {
          status: 'pending_transfer',
          location: payload.transfer.location_after || undefined,
        });
        return NextResponse.json({ success: true });

      case 'update_transfer':
        await updateTransferInSheet(payload.transferId, payload.updates);
        return NextResponse.json({ success: true });

      // Cập nhật trạng thái thiết bị sau khi bàn giao xong hoặc xử lý sự cố
      case 'update_asset_status':
        await updateAssetInSheet(payload.assetCode, {
          status: payload.status,
          current_holder_name: payload.holderName,
          location: payload.location,
          due_date: payload.dueDate || null,
          alert_reason: payload.alertReason || null,
        });
        return NextResponse.json({ success: true });

      // 4. Kiểm kê
      case 'append_audit':
        await appendAuditToSheet(payload.item, payload.sessionTitle || 'Kiểm kê');
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, error: `Action '${action}' không được hỗ trợ` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('API Google Sheets POST error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Lỗi ghi dữ liệu Google Sheets',
    }, { status: 500 });
  }
}
