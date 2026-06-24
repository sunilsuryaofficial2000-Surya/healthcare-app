"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../db/prisma");
const requireAuth_1 = require("../middleware/requireAuth");
const requireRoles_1 = require("../middleware/requireRoles");
const httpError_1 = require("../utils/httpError");
const audit_1 = require("../services/audit");
exports.patientsRouter = (0, express_1.Router)();
exports.patientsRouter.use(requireAuth_1.requireAuth);
exports.patientsRouter.get("/", (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR"), async (_req, res) => {
    const patients = await prisma_1.prisma.patient.findMany({
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    res.json({ patients });
});
exports.patientsRouter.post("/", (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR"), async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            mrn: zod_1.z.string().min(1),
            firstName: zod_1.z.string().min(1),
            lastName: zod_1.z.string().min(1),
            dateOfBirth: zod_1.z.string().datetime().optional(),
            gender: zod_1.z.string().optional(),
            phone: zod_1.z.string().optional(),
            email: zod_1.z.string().email().optional(),
            address: zod_1.z.string().optional(),
        })
            .parse(req.body);
        const patient = await prisma_1.prisma.patient.create({
            data: {
                mrn: body.mrn,
                firstName: body.firstName,
                lastName: body.lastName,
                dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
                gender: body.gender,
                phone: body.phone,
                email: body.email,
                address: body.address,
            },
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: req.user?.id,
            action: "CREATE_PATIENT",
            entityType: "Patient",
            entityId: patient.id,
            meta: { mrn: patient.mrn },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        res.status(201).json({ patient });
    }
    catch (e) {
        next(e);
    }
});
exports.patientsRouter.get("/:patientId", async (req, res, next) => {
    try {
        const patientId = zod_1.z.string().parse(req.params.patientId);
        const patient = await prisma_1.prisma.patient.findUnique({
            where: { id: patientId },
            include: { devices: true },
        });
        if (!patient)
            throw new httpError_1.HttpError(404, "Patient not found");
        const viewer = req.user;
        if (viewer?.role === "PATIENT" && viewer.patientId !== patientId) {
            throw new httpError_1.HttpError(403, "Forbidden");
        }
        res.json({ patient });
    }
    catch (e) {
        next(e);
    }
});
exports.patientsRouter.put("/:patientId", (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR"), async (req, res, next) => {
    try {
        const patientId = zod_1.z.string().parse(req.params.patientId);
        const body = zod_1.z
            .object({
            firstName: zod_1.z.string().min(1).optional(),
            lastName: zod_1.z.string().min(1).optional(),
            dateOfBirth: zod_1.z.string().datetime().nullable().optional(),
            gender: zod_1.z.string().nullable().optional(),
            phone: zod_1.z.string().nullable().optional(),
            email: zod_1.z.string().email().nullable().optional(),
            address: zod_1.z.string().nullable().optional(),
        })
            .parse(req.body);
        const patient = await prisma_1.prisma.patient.update({
            where: { id: patientId },
            data: {
                firstName: body.firstName ?? undefined,
                lastName: body.lastName ?? undefined,
                dateOfBirth: body.dateOfBirth === undefined ? undefined : body.dateOfBirth ? new Date(body.dateOfBirth) : null,
                gender: body.gender === undefined ? undefined : body.gender,
                phone: body.phone === undefined ? undefined : body.phone,
                email: body.email === undefined ? undefined : body.email,
                address: body.address === undefined ? undefined : body.address,
            },
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: req.user?.id,
            action: "UPDATE_PATIENT",
            entityType: "Patient",
            entityId: patient.id,
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        res.json({ patient });
    }
    catch (e) {
        next(e);
    }
});
