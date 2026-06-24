"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../db/prisma");
const jwt_1 = require("../auth/jwt");
const password_1 = require("../auth/password");
const requireAuth_1 = require("../middleware/requireAuth");
const requireRoles_1 = require("../middleware/requireRoles");
const httpError_1 = require("../utils/httpError");
const audit_1 = require("../services/audit");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/bootstrap", async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(8),
        })
            .parse(req.body);
        const userCount = await prisma_1.prisma.user.count();
        if (userCount > 0) {
            throw new httpError_1.HttpError(409, "Bootstrap is disabled");
        }
        const user = await prisma_1.prisma.user.create({
            data: {
                email: body.email,
                passwordHash: await (0, password_1.hashPassword)(body.password),
                role: "ADMIN",
            },
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: user.id,
            action: "BOOTSTRAP_ADMIN",
            entityType: "User",
            entityId: user.id,
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        const token = (0, jwt_1.signAccessToken)({ sub: user.id, email: user.email, role: user.role });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    }
    catch (e) {
        next(e);
    }
});
exports.authRouter.post("/login", async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(1),
        })
            .parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: body.email },
            include: { patient: true },
        });
        if (!user)
            throw new httpError_1.HttpError(401, "Invalid credentials");
        const ok = await (0, password_1.verifyPassword)(body.password, user.passwordHash);
        if (!ok)
            throw new httpError_1.HttpError(401, "Invalid credentials");
        const token = (0, jwt_1.signAccessToken)({
            sub: user.id,
            email: user.email,
            role: user.role,
            patientId: user.patient?.id ?? null,
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role, patientId: user.patient?.id ?? null },
        });
    }
    catch (e) {
        next(e);
    }
});
exports.authRouter.get("/me", requireAuth_1.requireAuth, async (req, res) => {
    res.json({ user: req.user });
});
exports.authRouter.post("/register", requireAuth_1.requireAuth, (0, requireRoles_1.requireRoles)("ADMIN"), async (req, res, next) => {
    try {
        const body = zod_1.z
            .object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(8),
            role: zod_1.z.enum(["ADMIN", "DOCTOR", "PATIENT"]),
            patient: zod_1.z
                .object({
                mrn: zod_1.z.string().min(1),
                firstName: zod_1.z.string().min(1),
                lastName: zod_1.z.string().min(1),
                gender: zod_1.z.string().optional(),
                phone: zod_1.z.string().optional(),
                email: zod_1.z.string().email().optional(),
                address: zod_1.z.string().optional(),
            })
                .optional(),
        })
            .parse(req.body);
        const user = await prisma_1.prisma.user.create({
            data: {
                email: body.email,
                passwordHash: await (0, password_1.hashPassword)(body.password),
                role: body.role,
                patient: body.role === "PATIENT" && body.patient
                    ? {
                        create: {
                            mrn: body.patient.mrn,
                            firstName: body.patient.firstName,
                            lastName: body.patient.lastName,
                            gender: body.patient.gender,
                            phone: body.patient.phone,
                            email: body.patient.email,
                            address: body.patient.address,
                        },
                    }
                    : undefined,
            },
            include: { patient: true },
        });
        await (0, audit_1.writeAuditLog)({
            actorUserId: req.user?.id,
            action: "CREATE_USER",
            entityType: "User",
            entityId: user.id,
            meta: { role: user.role },
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                patientId: user.patient?.id ?? null,
            },
        });
    }
    catch (e) {
        next(e);
    }
});
