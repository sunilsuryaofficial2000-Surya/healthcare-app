"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSeedData = ensureSeedData;
const prisma_1 = require("../db/prisma");
const password_1 = require("../auth/password");
const readingsMock_1 = require("../services/readingsMock");
async function ensureSeedData() {
    const seedEnabled = (process.env.SEED_DEMO ?? "true").toLowerCase() === "true";
    if (!seedEnabled)
        return;
    const userCount = await prisma_1.prisma.user.count();
    if (userCount > 0)
        return;
    const admin = await prisma_1.prisma.user.create({
        data: {
            email: "admin@demo.com",
            passwordHash: await (0, password_1.hashPassword)("Admin@123"),
            role: "ADMIN",
        },
    });
    await prisma_1.prisma.user.create({
        data: {
            email: "doctor@demo.com",
            passwordHash: await (0, password_1.hashPassword)("Doctor@123"),
            role: "DOCTOR",
        },
    });
    const patientUser = await prisma_1.prisma.user.create({
        data: {
            email: "patient@demo.com",
            passwordHash: await (0, password_1.hashPassword)("Patient@123"),
            role: "PATIENT",
        },
    });
    const patient = await prisma_1.prisma.patient.create({
        data: {
            mrn: "MRN-0001",
            firstName: "Alex",
            lastName: "Morgan",
            gender: "M",
            phone: "+91-9000000000",
            email: "alex.morgan@example.com",
            userId: patientUser.id,
        },
    });
    const extraPatient = await prisma_1.prisma.patient.create({
        data: {
            mrn: "MRN-0002",
            firstName: "Sam",
            lastName: "Taylor",
            gender: "F",
            phone: "+91-9000000001",
            email: "sam.taylor@example.com",
        },
    });
    const ecgDevice = await prisma_1.prisma.device.create({
        data: { serial: "ECG-DEV-001", type: "ECG", patientId: patient.id },
    });
    const bpDevice = await prisma_1.prisma.device.create({
        data: { serial: "BP-DEV-001", type: "BLOOD_PRESSURE", patientId: patient.id },
    });
    const glucoseDevice = await prisma_1.prisma.device.create({
        data: { serial: "GLU-DEV-001", type: "GLUCOSE", patientId: patient.id },
    });
    await prisma_1.prisma.device.create({
        data: { serial: "BP-DEV-002", type: "BLOOD_PRESSURE", patientId: extraPatient.id },
    });
    const now = new Date();
    await prisma_1.prisma.reading.createMany({
        data: [
            {
                type: "ECG",
                patientId: patient.id,
                deviceId: ecgDevice.id,
                recordedAt: new Date(now.getTime() - 1000 * 60 * 10),
                payload: (0, readingsMock_1.makeMockPayload)("ECG"),
                createdByUserId: admin.id,
            },
            {
                type: "BLOOD_PRESSURE",
                patientId: patient.id,
                deviceId: bpDevice.id,
                recordedAt: new Date(now.getTime() - 1000 * 60 * 6),
                payload: (0, readingsMock_1.makeMockPayload)("BLOOD_PRESSURE"),
                createdByUserId: admin.id,
            },
            {
                type: "GLUCOSE",
                patientId: patient.id,
                deviceId: glucoseDevice.id,
                recordedAt: new Date(now.getTime() - 1000 * 60 * 3),
                payload: (0, readingsMock_1.makeMockPayload)("GLUCOSE"),
                createdByUserId: admin.id,
            },
        ],
    });
}
