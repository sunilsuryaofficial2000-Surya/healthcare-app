import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireRoles } from "../middleware/requireRoles";
import { HttpError } from "../utils/httpError";
import { writeAuditLog } from "../services/audit";

export const devicesRouter = Router();

devicesRouter.use(requireAuth);

devicesRouter.get("/", async (req, res, next) => {
  try {
    const patientId = req.query.patientId ? z.string().parse(req.query.patientId) : undefined;
    const viewer = req.user;

    if (viewer?.role === "PATIENT") {
      const targetPatientId = patientId ?? viewer.patientId ?? undefined;
      if (!targetPatientId || targetPatientId !== viewer.patientId) {
        throw new HttpError(403, "Forbidden");
      }

      const devices = await prisma.device.findMany({
        where: { patientId: targetPatientId },
        orderBy: { createdAt: "desc" },
      });
      res.json({ devices });
      return;
    }

    if (viewer?.role !== "ADMIN" && viewer?.role !== "DOCTOR") {
      throw new HttpError(403, "Forbidden");
    }

    const devices = await prisma.device.findMany({
      where: patientId ? { patientId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { patient: true },
    });
    res.json({ devices });
  } catch (e) {
    next(e);
  }
});

devicesRouter.post("/", requireRoles("ADMIN", "DOCTOR"), async (req, res, next) => {
  try {
    const body = z
      .object({
        serial: z.string().min(1),
        type: z.enum(["ECG", "BLOOD_PRESSURE", "GLUCOSE"]),
        patientId: z.string().min(1),
      })
      .parse(req.body);

    const patient = await prisma.patient.findUnique({ where: { id: body.patientId } });
    if (!patient) throw new HttpError(404, "Patient not found");

    const device = await prisma.device.create({
      data: {
        serial: body.serial,
        type: body.type,
        patientId: body.patientId,
      },
    });

    await writeAuditLog({
      actorUserId: req.user?.id,
      action: "ASSIGN_DEVICE",
      entityType: "Device",
      entityId: device.id,
      meta: { serial: device.serial, patientId: device.patientId, type: device.type },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({ device });
  } catch (e) {
    next(e);
  }
});

devicesRouter.put("/:deviceId", requireRoles("ADMIN", "DOCTOR"), async (req, res, next) => {
  try {
    const deviceId = z.string().parse(req.params.deviceId);
    const body = z
      .object({
        status: z.string().min(1).optional(),
        patientId: z.string().min(1).optional(),
      })
      .parse(req.body);

    if (body.patientId) {
      const patient = await prisma.patient.findUnique({ where: { id: body.patientId } });
      if (!patient) throw new HttpError(404, "Patient not found");
    }

    const device = await prisma.device.update({
      where: { id: deviceId },
      data: {
        status: body.status ?? undefined,
        patientId: body.patientId ?? undefined,
      },
    });

    await writeAuditLog({
      actorUserId: req.user?.id,
      action: "UPDATE_DEVICE",
      entityType: "Device",
      entityId: device.id,
      meta: { status: body.status, patientId: body.patientId },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ device });
  } catch (e) {
    next(e);
  }
});
