export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export type User = {
  id: string;
  email: string;
  role: Role;
  patientId?: string | null;
};

export type Patient = {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type DeviceType = 'ECG' | 'BLOOD_PRESSURE' | 'GLUCOSE';

export type Device = {
  id: string;
  serial: string;
  type: DeviceType;
  status: string;
  patientId: string;
};

export type Reading = {
  id: string;
  type: DeviceType;
  patientId: string;
  deviceId?: string | null;
  recordedAt: string;
  payload: any;
};

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  actorUser?: { id: string; email: string; role: Role } | null;
};
