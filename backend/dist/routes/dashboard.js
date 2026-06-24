"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../db/prisma");
const requireAuth_1 = require("../middleware/requireAuth");
const requireRoles_1 = require("../middleware/requireRoles");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.use(requireAuth_1.requireAuth, (0, requireRoles_1.requireRoles)("ADMIN", "DOCTOR"));
exports.dashboardRouter.get("/summary", async (_req, res) => {
    const [patientsCount, devicesCount, readingsCount] = await Promise.all([
        prisma_1.prisma.patient.count(),
        prisma_1.prisma.device.count(),
        prisma_1.prisma.reading.count(),
    ]);
    const latest = await prisma_1.prisma.reading.findMany({
        orderBy: { recordedAt: "desc" },
        take: 30,
        include: { patient: true, device: true },
    });
    res.json({
        counts: { patients: patientsCount, devices: devicesCount, readings: readingsCount },
        latest,
    });
});
