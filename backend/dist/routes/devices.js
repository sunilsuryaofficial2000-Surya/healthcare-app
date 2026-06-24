"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devicesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../db/prisma");
const requireAuth_1 = require("../middleware/requireAuth");
const requireRoles_1 = require("../middleware/requireRoles");
const httpError_1 = require("../utils/httpError");
const audit_1 = require("../services/audit");
exports.devicesRouter = (0, express_1.Router)();
exports.devicesRouter.use(requireAuth_1.requireAuth);
exports.devicesRouter.get("/", async (req, res, next) => {
    try {
        const patientId = req.query.patientId ? zod_1.z.string().parse(req.query.patientId) : undefined;
        const viewer = req.user;
        if (viewer?.role === "PATIENT") {
            const targetPatientId = patientId ?? viewer.patientId ?? undefined;
            if (!targetPatientId || targetPatientId !== viewer.patientId) {
                throw new httpError_1.HttpError(403, "Forbidden");
            }
            const devices = await prisma_1.prisma.device.findMany({
                where: { patientId: targetPatientId },
                orderBy: { createdAt: "desc" },
            });
            res.json({ devices });
            return;
        }
        if (viewer?.role !== "ADMIN" && viewer?.role !== "DOCTOR") {
            throw new httpError_1.HttpError(403, "Forbidden");
        }
        const devices = await prisma_1.prisma.device.findMany({
            where: patientId ? { patientId } : undefined,
            orderBy: { createdAt: "desc" },
            include: { patient: true },
        });
        res.json({ devices });
    }
    catch (e) {
        next(e);
    }
});
exports.devicesRouter.post("/", (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR"), async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            serial: zod_1.z.string().min(1),
            type: zod_1.z.enum(["ECG", "BLOOD_PRESSURE", "GLUCOSE"]),
            patientId: zod_1.z.string().min(1),
        })
            .parse(req.body);
        const patient = await prisma_1.prisma.patient.findUnique({ where: { id: body.patientId } });
        if (!patient)
            throw new httpError_1.HttpError(404, "Patient not found");
        const device = await prisma_1.prisma.device.create({
            data: {
                serial: body.serial,
                type: body.type,
                patientId: body.patientId,
            },
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: req.user?.id,
            action: "ASSIGN_DEVICE",
            entityType: "Device",
            entityId: device.id,
            meta: { serial: device.serial, patientId: device.patientId, type: device.type },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        res.status(201).json({ device });
    }
    catch (e) {
        next(e);
    }
});
exports.devicesRouter.put("/:deviceId", (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR"), async (req, res, next) => {
    try {
        const deviceId = zod_1.z.string().parse(req.params.deviceId);
        const body = zod_1.z
            .object({
            status: zod_1.z.string().min(1).optional(),
            patientId: zod_1.z.string().min(1).optional(),
        })
            .parse(req.body);
        if (body.patientId) {
            const patient = await prisma_1.prisma.patient.findUnique({ where: { id: body.patientId } });
            if (!patient)
                throw new httpError_1.HttpError(404, "Patient not found");
        }
        const device = await prisma_1.prisma.device.update({
            where: { id: deviceId },
            data: {
                status: body.status ?? undefined,
                patientId: body.patientId ?? undefined,
            },
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: req.user?.id,
            action: "UPDATE_DEVICE",
            entityType: "Device",
            entityId: device.id,
            meta: { status: body.status, patientId: body.patientId },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        res.json({ device });
    }
    catch (e) {
        next(e);
    }
});
