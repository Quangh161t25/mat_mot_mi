import { NextResponse } from 'next/server';
import { 
  fetchAllFromSheets, 
  appendTransferToSheet, 
  appendAuditToSheet, 
  SPREADSHEET_ID, 
  getSheetsClient 
} from '@/lib/google-sheets';

export async function GET() {
  try {
    const data = await fetchAllFromSheets();
    return NextResponse.json({
      success: true,
      spreadsheetId: SPREADSHEET_ID,
      data,
    });
  } catch (err: any) {
    console.error('API Google Sheets GET error:', err);
    return NextResponse.json({
      success: false,
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
      return NextResponse.json({ success: false, error: 'Google Sheets chưa sẵn sàng' }, { status: 500 });
    }

    if (action === 'append_transfer') {
      await appendTransferToSheet(payload.transfer);
      return NextResponse.json({ success: true });
    }

    if (action === 'append_audit') {
      await appendAuditToSheet(payload.item, payload.sessionTitle || 'Kiểm kê');
      return NextResponse.json({ success: true });
    }

    if (action === 'update_asset_status') {
      // Find row matching asset_code in THIET_BI and update status & holder
      const { assetCode, status, holderName, location } = payload;
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'THIET_BI!A2:A1000',
      });
      const rows = res.data.values || [];
      const rowIndex = rows.findIndex(r => r[0]?.toString().trim().toUpperCase() === assetCode.trim().toUpperCase());

      if (rowIndex !== -1) {
        const actualRow = rowIndex + 2; // offset by header
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `THIET_BI!F${actualRow}:I${actualRow}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[location, '', holderName || '', status]]
          }
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Action không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    console.error('API Google Sheets POST error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Lỗi ghi dữ liệu Google Sheets',
    }, { status: 500 });
  }
}
