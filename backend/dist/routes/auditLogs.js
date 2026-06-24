"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../db/prisma");
const requireAuth_1 = require("../middleware/requireAuth");
const requireRoles_1 = require("../middleware/requireRoles");
exports.auditLogsRouter = (0, express_1.Router)();
exports.auditLogsRouter.use(requireAuth_1.requireAuth, (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR"));
exports.auditLogsRouter.get("/", async (req, res, next) => {
    try {
        const query = zod_1.z
            .object({
            entityType: zod_1.z.string().optional(),
            entityId: zod_1.z.string().optional(),
            limit: zod_1.z.coerce.number().min(1).max(200).optional(),
        })
            .parse(req.query);
        const logs = await prisma_1.prisma.auditLog.findMany({
            where: {
                entityType: query.entityType,
                entityId: query.entityId,
            },
            orderBy: { createdAt: "desc" },
            take: query.limit ?? 100,
            include: {
                actorUser: { select: { id: true, email: true, role: true } },
            },
        });
        res.json({ logs });
    }
    catch (e) {
        next(e);
    }
});
