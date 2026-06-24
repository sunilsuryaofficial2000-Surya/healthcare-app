import { Router } from "express";
import { prisma } from "../db/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireRoles } from "../middleware/requireRoles";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireRoles("ADMIN", "DOCTOR"));

dashboardRouter.get("/summary", async (_req, res) => {
  const [patientsCount, devicesCount, readingsCount] = await Promise.all([
    prisma.patient.count(),
    prisma.device.count(),
    prisma.reading.count(),
  ]);

  const latest = await prisma.reading.findMany({
    orderBy: { recordedAt: "desc" },
    take: 30,
    include: { patient: true, device: true },
  });

  res.json({
    counts: { patients: patientsCount, devices: devicesCount, readings: readingsCount },
    latest,
  });
});
