import { NextResponse } from 'next/server';
import { authenticatedData, clearSession, hashPassword, publicProfile, sameOrigin, setSession, verifyPassword } from '@/lib/auth';
import { fetchAllFromSheets, updateStaffInSheet } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';
const failures = new Map<string, { count: number; until: number }>();
const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const session = await authenticatedData();
    if (!session) return NextResponse.json({ success: false }, { status: 401, headers });
    return NextResponse.json({ success: true, user: publicProfile(session.user) }, { headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Không thể xác thực tài khoản. Vui lòng thử lại.' }, { status: 503, headers });
  }
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ success: false }, { status: 403, headers });
  clearSession();
  return NextResponse.json({ success: true }, { headers });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ success: false }, { status: 403, headers });
  try {
    const body = await req.json();
    if (body.action === 'change_password') {
      const session = await authenticatedData();
      if (!session) return NextResponse.json({ success: false }, { status: 401, headers });
      if (typeof body.password !== 'string' || body.password.trim().length < 4 || body.password.length > 256) {
        return NextResponse.json({ success: false, error: 'Mật khẩu phải có từ 4 đến 256 ký tự.' }, { status: 400, headers });
      }
      const password = hashPassword(body.password.trim());
      await updateStaffInSheet(session.user.id, { password });
      setSession({ ...session.user, password });
      return NextResponse.json({ success: true }, { headers });
    }
    if (typeof body.identifier !== 'string' || typeof body.password !== 'string' || body.identifier.length > 256 || body.password.length > 256) {
      return NextResponse.json({ success: false, error: 'Thông tin đăng nhập không hợp lệ.' }, { status: 400, headers });
    }
    const identifier = body.identifier.trim().toLowerCase();
    const now = Date.now();
    // Bounded per-account throttling; no dependency on untrusted forwarded IP headers.
    for (const [key, value] of Array.from(failures)) if (value.until < now) failures.delete(key);
    const attempt = failures.get(identifier);
    if (attempt && attempt.count >= 10) return NextResponse.json({ success: false, error: 'Đăng nhập sai quá nhiều lần. Thử lại sau 15 phút.' }, { status: 429, headers });
    const data = await fetchAllFromSheets(true, true);
    const user = data.profiles.find(p => p.email?.toLowerCase() === identifier ||
      p.full_name?.toLowerCase() === identifier || p.phone?.replace(/\s+/g, '') === identifier.replace(/\s+/g, ''));
    if (!user || user.status !== 'active' || !user.password || !verifyPassword(body.password.trim(), user.password)) {
      if (failures.size < 10000) failures.set(identifier, { count: (attempt?.count || 0) + 1, until: attempt?.until || now + 15 * 60 * 1000 });
      return NextResponse.json({ success: false, error: 'Tài khoản hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.' }, { status: 401, headers });
    }
    failures.delete(identifier);
    setSession(user);
    return NextResponse.json({ success: true, user: publicProfile(user) }, { headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Không thể xác thực với Google Sheets. Vui lòng thử lại.' }, { status: 503, headers });
  }
}
