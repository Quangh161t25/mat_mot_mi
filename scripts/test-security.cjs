// Isolated API regression tests: all Sheets reads/writes use fixtures, never live data.
const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

process.env.AUTH_SECRET = 'isolated-test-signing-key';
const root = path.resolve(__dirname, '..');
let jar, writes, data, unavailable;
const cookieOptions = new Map();
const cookieStore = {
  get: name => jar.has(name) ? { value: jar.get(name) } : undefined,
  set(name, value, options) {
    cookieOptions.set(name, options);
    if (options.maxAge === 0) jar.delete(name); else jar.set(name, value);
  },
};
const sheets = {
  fetchAllFromSheets: async () => { if (unavailable) throw new Error('offline'); return data; },
  getSheetsClient: () => ({}),
  getGoogleAuthDiagnostics: () => ({}),
  updateStaffInSheet: async (id, updates) => {
    writes.push(['staff', id, updates]);
    Object.assign(data.profiles.find(p => p.id === id), updates);
  },
  updateTransferInSheet: async (...args) => writes.push(['transfer', ...args]),
  updateAssetInSheet: async (...args) => writes.push(['asset', ...args]),
  appendAttendanceToSheet: async record => writes.push(['attendance', record]),
  appendLogToSheet: async log => writes.push(['log', log]),
  deleteTransferInSheet: async id => writes.push(['deleteTransfer', id]),
  deleteAuditItemInSheet: async (...args) => writes.push(['deleteAudit', ...args]),
};
const load = Module._load;
Module._load = function (id, parent, main) {
  if (id === 'next/headers') return { cookies: () => cookieStore };
  if (id === '@/lib/google-sheets') return sheets;
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return load.call(this, id, parent, main);
};
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
};
const auth = require('../src/lib/auth.ts');
const authRoute = require('../src/app/api/auth/route.ts');
const api = require('../src/app/api/sheets/route.ts');
const { authorizeAction, permittedData } = require('../src/lib/api-permissions.ts');

function request(body, origin = 'http://localhost:3100', url = '/api/sheets') {
  return new Request(`http://localhost:3100${url}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  });
}
function login(id = 'admin', password = 'fixture-secret') {
  return authRoute.POST(request({ identifier: id, password }, undefined, '/api/auth'));
}
beforeEach(() => {
  jar = new Map(); writes = []; unavailable = false; cookieOptions.clear();
  data = {
    profiles: [
      { id: 'admin', email: 'admin@test.invalid', full_name: 'admin', phone: '1', role: 'admin', status: 'active', password: 'fixture-secret' },
      { id: 'sender', email: 'sender@test.invalid', full_name: 'sender', phone: '2', role: 'staff', status: 'active', password: 'fixture-secret' },
      { id: 'receiver', email: 'receiver@test.invalid', full_name: 'receiver', phone: '3', role: 'staff', status: 'active', password: 'fixture-secret' },
    ],
    assets: [{ id: 'a1', code: 'EQ-1', name: 'Camera', current_holder_id: 'sender', location: 'Studio', status: 'pending_transfer' }],
    transfers: [{ id: 'tr1', asset_code: 'EQ-1', from_user_id: 'sender', to_user_id: 'receiver', to_user_name: 'receiver', transfer_type: 'peer_transfer', status: 'pending', location_after: 'Show', due_date: '2026-12-01' }],
    auditItems: [{ id: 'audit1', asset_code: 'EQ-1', session_id: 'session1' }], auditSessions: [], combos: [],
    logs: [{ id: 'log1', details: '{"password":"old-secret"}' }],
    attendance: [{ user_id: 'sender' }, { user_id: 'receiver' }],
  };
});

test('anonymous requests cannot read or mutate Sheets', async () => {
  assert.equal((await api.GET(new Request('http://localhost:3100/api/sheets'))).status, 401);
  assert.equal((await api.POST(request({ action: 'delete_asset', payload: { code: 'EQ-1' } }))).status, 401);
  assert.equal(writes.length, 0);
});
test('bad password and unknown user fail without a session', async () => {
  assert.equal((await login('admin', 'wrong')).status, 401);
  assert.equal((await login('unknown')).status, 401);
  assert.equal(jar.size, 0);
});
test('successful login sets an HttpOnly cookie and returns no password', async () => {
  const response = await login();
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.user.id, 'admin');
  assert.equal('password' in json.user, false);
  assert.equal(cookieOptions.get('mmm_session').httpOnly, true);
  assert.equal(cookieOptions.get('mmm_session').sameSite, 'lax');
});
test('tampered or expired session is rejected', async () => {
  await login();
  jar.set('mmm_session', jar.get('mmm_session') + 'tampered');
  assert.equal((await authRoute.GET()).status, 401);
  const now = Date.now;
  try {
    Date.now = () => now() - 24 * 60 * 60 * 1000;
    await login();
  } finally { Date.now = now; }
  assert.equal((await authRoute.GET()).status, 401);
});
test('locked/deleted accounts and password changes invalidate existing sessions', async () => {
  await login();
  data.profiles[0].status = 'locked';
  assert.equal((await authRoute.GET()).status, 401);
  data.profiles[0].status = 'active';
  data.profiles[0].password = 'changed';
  assert.equal((await authRoute.GET()).status, 401);
  data.profiles = [];
  assert.equal((await authRoute.GET()).status, 401);
});
test('authentication fails closed when Sheets is unavailable', async () => {
  unavailable = true;
  assert.equal((await login()).status, 503);
  assert.equal(jar.size, 0);
});
test('password changes hash the password, renew session and reject the previous cookie', async () => {
  await login();
  const previous = jar.get('mmm_session');
  const response = await authRoute.POST(request({ action: 'change_password', password: 'new-fixture-secret' }));
  assert.equal(response.status, 200);
  assert.ok(data.profiles[0].password.startsWith('scrypt$'));
  assert.equal(auth.verifyPassword('new-fixture-secret', data.profiles[0].password), true);
  assert.equal(auth.verifyPassword('fixture-secret', data.profiles[0].password), false);
  assert.equal((await authRoute.GET()).status, 200);
  jar.set('mmm_session', previous);
  assert.equal((await authRoute.GET()).status, 401);
});
test('logout clears server session cookie', async () => {
  await login();
  assert.equal((await authRoute.DELETE(request({}))).status, 200);
  assert.equal((await authRoute.GET()).status, 401);
});
test('cross-origin login, writes and logout are blocked', async () => {
  const req = request({ identifier: 'admin', password: 'fixture-secret' }, 'https://other.invalid');
  assert.equal((await authRoute.POST(req)).status, 403);
  assert.equal((await api.POST(request({}, 'https://other.invalid'))).status, 403);
  assert.equal((await authRoute.DELETE(request({}, 'https://other.invalid'))).status, 403);
});
test('all authenticated responses omit passwords, hashes and old log details', async () => {
  await login();
  const response = await api.GET(new Request('http://localhost:3100/api/sheets'));
  const json = await response.json();
  assert.equal(response.status, 200);
  assert.equal(JSON.stringify(json).includes('fixture-secret'), false);
  assert.equal(JSON.stringify(json).includes('old-secret'), false);
  assert.ok(json.data.profiles.every(p => !('password' in p)));
});
test('staff cannot promote themselves, grant permissions or delete equipment', async () => {
  await login('receiver');
  for (const [action, payload] of [
    ['update_staff', { id: 'receiver', updates: { role: 'admin' } }],
    ['update_permissions', { userId: 'receiver', permissions: {} }],
    ['delete_asset', { code: 'EQ-1' }],
    ['append_staff', { profile: { role: 'admin', password: 'secret' } }],
  ]) assert.equal((await api.POST(request({ action, payload }))).status, 403, action);
  assert.equal(writes.length, 0);
});
test('staff directory is minimal and attendance is restricted to own records', () => {
  const filtered = permittedData(data, data.profiles[1]);
  assert.equal(filtered.logs.length, 0);
  assert.equal(filtered.profiles[0].email, undefined);
  assert.equal(filtered.profiles[0].permissions, undefined);
  assert.equal(filtered.profiles[1].email, 'sender@test.invalid');
  assert.deepEqual(filtered.attendance, [{ user_id: 'sender' }]);
});
test('sender cannot confirm own handover, including an admin sender', async () => {
  const payload = { transferId: 'tr1', updates: { status: 'completed' } };
  assert.equal(authorizeAction(data.profiles[1], data, 'update_transfer', payload), false);
  data.transfers[0].from_user_id = 'admin';
  assert.equal(authorizeAction(data.profiles[0], data, 'update_transfer', payload), false);
});
test('recipient confirmation updates asset using authoritative transfer values', async () => {
  await login('receiver');
  const response = await api.POST(request({ action: 'update_transfer', payload: { transferId: 'tr1', updates: { status: 'completed' } } }));
  assert.equal(response.status, 200);
  assert.equal(writes[0][0], 'transfer');
  assert.deepEqual(writes[1], ['asset', 'EQ-1', { status: 'in_use', current_holder_name: 'receiver', location: 'Show', due_date: '2026-12-01', alert_reason: null }]);
});
test('closed transfers and unrelated recipients cannot confirm', () => {
  const payload = { transferId: 'tr1', updates: { status: 'completed' } };
  const other = { ...data.profiles[2], id: 'unrelated' };
  assert.equal(authorizeAction(other, data, 'update_transfer', payload), false);
  data.transfers[0].status = 'completed';
  assert.equal(authorizeAction(data.profiles[2], data, 'update_transfer', payload), false);
});
test('extra fields cannot bypass sender restriction even with transfer-edit permission', () => {
  const admin = data.profiles[0];
  data.transfers[0].from_user_id = admin.id;
  assert.equal(authorizeAction(admin, data, 'update_transfer', {
    transferId: 'tr1', updates: { status: 'completed', location_after: 'Forged' },
  }), false);
});
test('delegated staff management cannot modify or create privileged accounts', () => {
  const { DEFAULT_PERMISSIONS_BY_ROLE } = require('../src/types/index.ts');
  const manager = { ...data.profiles[1], role: 'manager', permissions: {
    ...DEFAULT_PERMISSIONS_BY_ROLE.manager, staff: { view: true, create: true, edit: true, delete: true },
  } };
  assert.equal(authorizeAction(manager, data, 'append_staff', { profile: { role: 'staff', password: 'new-secret' } }), true);
  assert.equal(authorizeAction(manager, data, 'append_staff', { profile: { role: 'admin' } }), false);
  assert.equal(authorizeAction(manager, data, 'update_staff', { id: 'admin', updates: { password: 'changed' } }), false);
  assert.equal(authorizeAction(manager, data, 'update_staff', { id: 'receiver', updates: { permissions: {} } }), false);
});
test('new transfer cannot spoof sender or hand over somebody else equipment', () => {
  data.assets[0].status = 'in_use'; data.transfers = [];
  const t = { asset_code: 'EQ-1', from_user_id: 'receiver', to_user_id: 'admin', status: 'pending', transfer_type: 'peer_transfer' };
  assert.equal(authorizeAction(data.profiles[2], data, 'append_transfer', { transfer: t }), false);
  t.from_user_id = 'sender';
  assert.equal(authorizeAction(data.profiles[2], data, 'append_transfer', { transfer: t }), false);
  assert.equal(authorizeAction(data.profiles[1], data, 'append_transfer', { transfer: t }), true);
});
test('log and attendance identity comes from server session', async () => {
  await login('receiver');
  await api.POST(request({ action: 'append_log', payload: { log: { user_id: 'admin', user_role: 'admin', details: 'password' } } }));
  await api.POST(request({ action: 'append_attendance', payload: { record: { user_id: 'admin', user_role: 'admin', type: 'check_in' } } }));
  assert.equal(writes[0][1].user_id, 'receiver');
  assert.equal(writes[0][1].details, undefined);
  assert.equal(writes[1][1].user_id, 'receiver');
  assert.equal(writes[1][1].user_role, 'staff');
});
test('delete actions use the frontend transfer ID and resolve audit IDs server-side', async () => {
  await login();
  assert.equal((await api.POST(request({ action: 'delete_transfer', payload: { transferId: 'tr1' } }))).status, 200);
  assert.equal((await api.POST(request({ action: 'delete_audit_item', payload: { id: 'audit1' } }))).status, 200);
  assert.deepEqual(writes, [['deleteTransfer', 'tr1'], ['deleteAudit', 'EQ-1', 'session1']]);
});


test('attendance rejects duplicate check-in and checkout without an open shift', async () => {
  await login('receiver');
  data.attendance = [];
  const post = type => api.POST(request({ action: 'append_attendance', payload: { record: { type } } }));
  assert.equal((await post('check_out')).status, 409);
  assert.equal((await post('check_in')).status, 200);
  data.attendance.push({ id: 'in', user_id: 'receiver', type: 'check_in', timestamp: '2026-11-03T01:00:00Z' });
  assert.equal((await post('check_in')).status, 409);
  assert.equal((await post('check_out')).status, 200);
  data.attendance.push({ id: 'out', user_id: 'receiver', type: 'check_out', timestamp: '2026-11-03T02:00:00Z' });
  assert.equal((await post('check_out')).status, 409);
  assert.equal((await post('check_in')).status, 200);
});

test('studio and show shifts are independent and repeated show arrival is rejected', async () => {
  await login('receiver');
  data.attendance = [{ user_id: 'receiver', type: 'show_check_in', timestamp: '2026-11-03T01:00:00Z' }];
  const post = type => api.POST(request({ action: 'append_attendance', payload: { record: { type } } }));
  assert.equal((await post('show_check_in')).status, 409);
  assert.equal((await post('show_check_out')).status, 200);
  assert.equal((await post('check_in')).status, 200);
  assert.equal((await post('invalid')).status, 409);
});
