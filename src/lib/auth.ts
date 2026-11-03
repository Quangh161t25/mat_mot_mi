import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { fetchAllFromSheets } from '@/lib/google-sheets';
import { UserProfile } from '@/types';

const COOKIE_NAME = 'mmm_session';
const SESSION_SECONDS = 60 * 60 * 12;
let signingKey: string;

function secret() {
  if (signingKey) return signingKey;
  signingKey = process.env.AUTH_SECRET || process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_KEY || '';
  if (!signingKey) {
    try {
      const credentials = JSON.parse(readFileSync(path.join(process.cwd(), 'google-service-account.json'), 'utf8'));
      signingKey = credentials.private_key || credentials.privatekey;
    } catch { /* Authentication fails closed without a signing key. */ }
  }
  if (!signingKey) throw new Error('Chưa cấu hình AUTH_SECRET trên máy chủ.');
  return signingKey;
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith('scrypt$')) return equal(password, stored);
  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  return equal(scryptSync(password, salt, 64).toString('hex'), hash);
}

export function publicProfile(user: UserProfile): UserProfile {
  const { password: _password, ...profile } = user;
  return profile;
}

export function setSession(user: UserProfile) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id, expires: Date.now() + SESSION_SECONDS * 1000,
    credential: sign(user.password || ''),
  })).toString('base64url');
  cookies().set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS,
  });
}

export function clearSession() {
  cookies().set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}

export async function authenticatedData(fresh = false) {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !equal(sign(payload), signature)) return null;
  let session;
  try { session = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
  if (!session.id || !(session.expires > Date.now())) return null;
  const data = await fetchAllFromSheets(fresh, true);
  const user = data.profiles.find((p: UserProfile) => p.id === session.id);
  if (!user || user.status !== 'active' || !equal(sign(user.password || ''), session.credential || '')) return null;
  return { user, data };
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  return !origin || origin === new URL(req.url).origin;
}
