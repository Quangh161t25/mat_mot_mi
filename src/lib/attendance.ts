import { AttendanceRecord, AttendanceType } from '@/types';

export function latestAttendance(records: AttendanceRecord[], userId: string, show: boolean) {
  return records.filter(record => record.user_id === userId && record.type?.startsWith('show_') === show)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
}

export function attendanceError(records: AttendanceRecord[], userId: string, type: AttendanceType) {
  if (!['check_in', 'check_out', 'show_check_in', 'show_check_out'].includes(type)) return 'Loại chấm công không hợp lệ.';
  const latest = latestAttendance(records, userId, type.startsWith('show_'));
  const active = latest?.type.endsWith('check_in');
  if (type.endsWith('check_in') && active) return 'Bạn đang trong ca. Vui lòng ra ca trước khi vào ca mới.';
  if (type.endsWith('check_out') && !active) return 'Bạn chưa vào ca hoặc đã ra ca rồi.';
  return null;
}
