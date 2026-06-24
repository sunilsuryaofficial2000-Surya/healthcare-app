import type { DeviceType, Role } from '../api/types';

export function getRoleIcon(role?: Role | null) {
  if (role === 'ADMIN') return 'shield-account';
  if (role === 'DOCTOR') return 'stethoscope';
  if (role === 'PATIENT') return 'account-heart';
  return 'account';
}

export function getReadingIcon(type?: DeviceType | 'ALL' | null) {
  if (type === 'ECG') return 'heart-pulse';
  if (type === 'BLOOD_PRESSURE') return 'heart-box';
  if (type === 'GLUCOSE') return 'water';
  return 'chart-line';
}
