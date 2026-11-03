import { attendanceError } from '@/lib/attendance';
import { authenticatedData, hashPassword, sameOrigin } from '@/lib/auth';
import { authorizeAction, permittedData } from '@/lib/api-permissions';
import { NextResponse } from 'next/server';
import { 
  appendAssetToSheet,
  updateAssetInSheet,
  deleteAssetInSheet,
  batchDeleteAssetsInSheet,
  appendStaffToSheet,
  updateStaffInSheet,
  deleteStaffInSheet,
  batchDeleteStaffInSheet,
  appendTransferToSheet, 
  updateTransferInSheet,
  deleteTransferInSheet,
  batchDeleteTransfersInSheet,
  appendAuditToSheet,
  deleteAuditItemInSheet,
  deleteAuditSessionInSheet,
  appendLogToSheet,
  updateStaffPermissionsInSheet,
  appendComboToSheet,
  deleteComboFromSheet,
  appendAttendanceToSheet,
  deleteAttendanceFromSheet,
  getSheetsClient,
  getGoogleAuthDiagnostics
} from '@/lib/google-sheets';

// Cấu hình không cache và timeout an toàn cho Vercel Serverless
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 15;

const corsAndNoCacheHeaders = {
  'Content-Type': 'application/json',
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

export async function GET(req: Request) {
  try {
    const session = await authenticatedData(new URL(req.url).searchParams.has('fresh'));
    if (!session) return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập.' }, { status: 401, headers: corsAndNoCacheHeaders });
    return NextResponse.json({ success: true, connected: true, data: permittedData(session.data, session.user) }, { headers: corsAndNoCacheHeaders });
  } catch {
    return NextResponse.json({ success: false, connected: false, error: 'Không thể đọc Google Sheets. Vui lòng thử lại.' }, { status: 503, headers: corsAndNoCacheHeaders });
  }
}

const attendanceWrites = new Set<string>();

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ success: false, error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  try {
    const session = await authenticatedData();
    if (!session) return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập.' }, { status: 401 });
    const body = await req.json();
    const { action, payload } = body;

    if (!authorizeAction(session.user, session.data, action, payload)) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 });
    }
    const user = session.user;
    // Never trust identity, roles, or display names supplied by the browser.
    if (action === 'append_log') {
      payload.log = { ...payload.log, user_id: user.id, user_name: user.full_name, user_role: user.role, details: undefined };
    }
    if (action === 'append_attendance') {
      payload.record = { ...payload.record, user_id: user.id, user_name: user.full_name, user_role: user.role, user_avatar: user.avatar_url, timestamp: new Date().toISOString() };
    }
    if (action === 'append_audit') {
      payload.item = { ...payload.item, scanned_by_id: user.id, scanned_by_name: user.full_name };
    }
    for (const t of action === 'append_transfer' ? [payload.transfer] : action === 'append_combo_transfer' ? payload.transfers : []) {
      const asset = session.data.assets.find(a => a.code === t.asset_code)!;
      const receiver = session.data.profiles.find(p => p.id === t.to_user_id)!;
      Object.assign(t, { from_user_id: user.id, from_user_name: user.full_name, to_user_name: receiver.full_name, asset_name: asset.name, created_at: new Date().toISOString() });
    }
    if (action === 'append_staff' || action === 'update_staff') {
      const profile = action === 'append_staff' ? payload.profile : payload.updates;
      if (profile.password !== undefined) {
        if (typeof profile.password !== 'string' || profile.password.trim().length < 4 || profile.password.length > 256) {
          return NextResponse.json({ success: false, error: 'Mật khẩu phải có từ 4 đến 256 ký tự.' }, { status: 400 });
        }
        profile.password = hashPassword(profile.password.trim());
      } else if (action === 'append_staff') {
        return NextResponse.json({ success: false, error: 'Vui lòng nhập mật khẩu cho nhân sự mới.' }, { status: 400 });
      }
    }
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

      case 'batch_delete_assets':
        await batchDeleteAssetsInSheet(payload.codes);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      // 2. Quản lý nhân sự
      case 'append_staff':
        await appendStaffToSheet(payload.profile);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'update_staff':
        await updateStaffInSheet(payload.id, payload.updates);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'delete_staff':
        await deleteStaffInSheet(payload.id);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'batch_delete_staff':
        await batchDeleteStaffInSheet(payload.ids);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'update_permissions':
        await updateStaffPermissionsInSheet(payload.userId, payload.permissions);
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
        await updateTransferInSheet(payload.transferId, {
          ...payload.updates,
          ...(payload.updates.status === 'completed' ? { confirmed_at: new Date().toISOString() } : {}),
        });
        if (['completed', 'rejected'].includes(payload.updates.status)) {
          const transfer = session.data.transfers.find(t => t.id === payload.transferId)!;
          const asset = session.data.assets.find(a => a.code === transfer.asset_code)!;
          const completed = payload.updates.status === 'completed';
          const returned = transfer.transfer_type === 'return';
          await updateAssetInSheet(transfer.asset_code, completed ? {
            status: returned ? 'available' : 'in_use',
            current_holder_name: returned ? '' : transfer.to_user_name,
            location: transfer.location_after || asset.location,
            due_date: returned ? null : transfer.due_date,
            alert_reason: null,
          } : { status: asset.current_holder_id ? 'in_use' : 'available' });
        }
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'delete_transfer':
        await deleteTransferInSheet(payload.transferId);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'batch_delete_transfers':
        await batchDeleteTransfersInSheet(payload.ids);
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
        await updateAssetInSheet(payload.item.asset_code, {
          location: payload.item.actual_location,
          current_holder_name: session.data.profiles.find(p => p.id === payload.item.actual_holder_id)?.full_name || '',
          status: payload.item.actual_status,
        });
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'delete_audit_item':
        const item = session.data.auditItems.find(i => i.id === payload.id);
        if (!item) return NextResponse.json({ success: false }, { status: 404 });
        await deleteAuditItemInSheet(item.asset_code, item.session_id);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'delete_audit_session':
        await deleteAuditSessionInSheet(payload.sessionId);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      // 5. Nhật ký hoạt động
      case 'append_log':
        await appendLogToSheet(payload.log);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      // 6. Quản lý Combo
      case 'append_combo':
        await appendComboToSheet(payload.combo);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'delete_combo':
        await deleteComboFromSheet(payload.comboId);
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      case 'append_combo_transfer':
        if (Array.isArray(payload.transfers)) {
          for (const tr of payload.transfers) {
            await appendTransferToSheet(tr);
            await updateAssetInSheet(tr.asset_code, {
              status: 'pending_transfer',
              location: tr.location_after || undefined,
            });
          }
        }
        return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });

      // 7. Chấm công (CHAM_CONG)
      case 'append_attendance': {
        if (attendanceWrites.has(user.id)) return NextResponse.json({ success: false, error: 'Đang ghi nhận chấm công. Vui lòng chờ.' }, { status: 409 });
        attendanceWrites.add(user.id);
        try {
          const latest = await authenticatedData(true);
          if (!latest) return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập lại.' }, { status: 401 });
          const invalid = attendanceError(latest.data.attendance || [], user.id, payload.record.type);
          if (invalid) return NextResponse.json({ success: false, error: invalid }, { status: 409 });
          await appendAttendanceToSheet(payload.record);
          return NextResponse.json({ success: true }, { headers: corsAndNoCacheHeaders });
        } finally {
          attendanceWrites.delete(user.id);
        }
      }

      case 'delete_attendance':
        await deleteAttendanceFromSheet(payload.id);
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
      error: 'Không thể ghi dữ liệu Google Sheets. Vui lòng thử lại.',
    }, { 
      status: 500,
      headers: corsAndNoCacheHeaders
    });
  }
}
