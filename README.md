# Healthcare Platform (React Native + Node.js)

An online Healthcare Platform built with:

- **Mobile**: React Native (Expo) + React Navigation + React Native Paper
- **Backend**: Node.js (Express) + Prisma (SQLite) + socket.io

The platform demonstrates:

- Authentication & Role Management (Admin / Doctor / Patient)
- Patient Management
- Device Management
- Health Readings Management (ECG, Blood Pressure, Glucose) using mock data
- Real-time reading updates with socket.io
- Dashboard summaries & Audit Logs

## Project Structure

- [backend](file:///c:/wamp64/www/healthcare/backend): REST API + WebSocket server
- [mobile](file:///c:/wamp64/www/healthcare/mobile): Expo React Native app

## Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node.js)
- Android emulator or Expo Go on a device (optional, for mobile testing)

## Backend (Node.js)

### Setup & Run

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

- API base URL: `http://localhost:4000/api`
- Socket.io server: `http://localhost:4000`

### Environment Variables

Create `backend/.env` (or copy from `backend/.env.example`):

- `DATABASE_URL` (default `file:./dev.db`)
- `PORT` (default `4000`)
- `JWT_SECRET` (optional in development; recommended to set)
- `SEED_DEMO` (`true`/`false`) to seed demo users and sample data

### Demo Accounts (Auto-seeded)

- Admin: `admin@demo.com` / `Admin@123`
- Doctor: `doctor@demo.com` / `Doctor@123`
- Patient: `patient@demo.com` / `Patient@123`

### Main API Endpoints

- Auth
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Dashboard
  - `GET /api/dashboard/summary` (ADMIN/DOCTOR)
- Patients
  - `GET /api/patients` (ADMIN/DOCTOR)
  - `GET /api/patients/:patientId`
- Devices
  - `GET /api/devices`
- Readings
  - `GET /api/readings`
  - `POST /api/patients/:patientId/readings` (ADMIN/DOCTOR/PATIENT)
  - `POST /api/patients/:patientId/readings/mock` (ADMIN/DOCTOR)
- Audit Logs
  - `GET /api/audit-logs` (ADMIN/DOCTOR)

### Real-time Events (socket.io)

- Event emitted: `reading:new`
- Patient room: `patient:{patientId}`
- Subscribe: client emits `patient:subscribe` with `patientId`

## Mobile (Expo React Native)

### Setup & Run

```bash
cd mobile
npm install
npm run start
```

From the Expo CLI UI:

- Press `w` for web (or run `npm run web`)
- Press `a` for Android emulator
- Scan the QR in Expo Go for a physical device

### Configure Backend URLs

The app reads:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SOCKET_URL`

Defaults (Android emulator friendly):

- API: `http://10.0.2.2:4000/api`
- Socket: `http://10.0.2.2:4000`

If you run Expo web locally, use:

```bash
set EXPO_PUBLIC_API_URL=http://localhost:4000/api
set EXPO_PUBLIC_SOCKET_URL=http://localhost:4000
npm run start
```

If you use a physical device, replace `localhost` with your machine LAN IP (example):

```bash
set EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api
set EXPO_PUBLIC_SOCKET_URL=http://192.168.1.10:4000
npm run start
```

## How To Test Key Flows

- Login with any demo account
- Admin/Doctor:
  - Open Patients → open a patient → “Create reading” (mock) to generate ECG/BP/Glucose
  - Open Readings to see new entries in the feed
  - Open Audit Logs to see actions such as login and reading creation
- Patient:
  - Open Readings and press “Add reading” to simulate a new reading
  - Observe real-time updates (the feed updates instantly)

## Troubleshooting

- Port already in use:
  - Backend uses port `4000`
  - Expo web commonly uses `19006`
  - Stop the existing process or change the port (backend: `PORT` in `.env`)
- Reset local database:
  - Stop backend
  - Delete `backend/dev.db`
  - Run `npx prisma migrate dev` again
