"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../db/prisma");
const requireAuth_1 = require("../middleware/requireAuth");
const requireRoles_1 = require("../middleware/requireRoles");
const httpError_1 = require("../utils/httpError");
const readingsMock_1 = require("../services/readingsMock");
const socket_1 = require("../realtime/socket");
const audit_1 = require("../services/audit");
exports.readingsRouter = (0, express_1.Router)();
exports.readingsRouter.use(requireAuth_1.requireAuth);
exports.readingsRouter.get("/", async (req, res, next) => {
    try {
        const query = zod_1.z
            .object({
            patientId: zod_1.z.string().optional(),
            type: zod_1.z.enum(["ECG", "BLOOD_PRESSURE", "GLUCOSE"]).optional(),
            limit: zod_1.z.coerce.number().min(1).max(200).optional(),
        })
            .parse(req.query);
        const viewer = req.user;
        const patientId = viewer?.role === "PATIENT" ? viewer.patientId ?? undefined : query.patientId ?? undefined;
        if (viewer?.role === "PATIENT" && query.patientId && query.patientId !== viewer.patientId) {
            throw new httpError_1.HttpError(403, "Forbidden");
        }
        if (viewer?.role !== "PATIENT" && viewer?.role !== "ADMIN" && viewer?.role !== "DOCTOR") {
            throw new httpError_1.HttpError(403, "Forbidden");
        }
        const readings = await prisma_1.prisma.reading.findMany({
            where: {
                patientId,
                type: query.type,
            },
            orderBy: { recordedAt: "desc" },
            take: query.limit ?? 50,
            include: { patient: true, device: true },
        });
        res.json({ readings });
    }
    catch (e) {
        next(e);
    }
});
exports.readingsRouter.post("/patients/:patientId/readings", (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR", "PATIENT"), async (req, res, next) => {
    try {
        const patientId = zod_1.z.string().parse(req.params.patientId);
        const viewer = req.user;
        if (viewer?.role === "PATIENT" && viewer.patientId !== patientId) {
            throw new httpError_1.HttpError(403, "Forbidden");
        }
        const body = zod_1.z
            .object({
            type: zod_1.z.enum(["ECG", "BLOOD_PRESSURE", "GLUCOSE"]),
            deviceId: zod_1.z.string().optional(),
            recordedAt: zod_1.z.string().datetime().optional(),
            payload: zod_1.z.unknown().optional(),
        })
            .parse(req.body);
        const patient = await prisma_1.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new httpError_1.HttpError(404, "Patient not found");
        if (body.deviceId) {
            const device = await prisma_1.prisma.device.findUnique({ where: { id: body.deviceId } });
            if (!device || device.patientId !== patientId) {
                throw new httpError_1.HttpError(400, "Invalid device");
            }
        }
        const payload = body.payload ?? (0, readingsMock_1.makeMockPayload)(body.type);
        const reading = await prisma_1.prisma.reading.create({
            data: {
                type: body.type,
                patientId,
                deviceId: body.deviceId,
                recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
                payload: payload,
                createdByUserId: viewer?.id ?? null,
            },
            include: { patient: true, device: true },
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: viewer?.id,
            action: "CREATE_READING",
            entityType: "Reading",
            entityId: reading.id,
            meta: { patientId, type: reading.type },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        (0, socket_1.emitReadingUpdate)(patientId, reading);
        res.status(201).json({ reading });
    }
    catch (e) {
        next(e);
    }
});
exports.readingsRouter.post("/patients/:patientId/readings/mock", (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR"), async (req, res, next) => {
    try {
        const patientId = zod_1.z.string().parse(req.params.patientId);
        const body = zod_1.z
            .object({
            type: zod_1.z.enum(["ECG", "BLOOD_PRESSURE", "GLUCOSE"]),
            deviceId: zod_1.z.string().optional(),
        })
            .parse(req.body);
        const payload = (0, readingsMock_1.makeMockPayload)(body.type);
        const reading = await prisma_1.prisma.reading.create({
            data: {
                type: body.type,
                patientId,
                deviceId: body.deviceId,
                recordedAt: new Date(),
                payload: payload,
                createdByUserId: req.user?.id ?? null,
            },
            include: { patient: true, device: true },
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: req.user?.id,
            action: "MOCK_READING",
            entityType: "Reading",
            entityId: reading.id,
            meta: { patientId, type: reading.type },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        (0, socket_1.emitReadingUpdate)(patientId, reading);
        res.status(201).json({ reading });
    }
    catch (e) {
        next(e);
    }
});
