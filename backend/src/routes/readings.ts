import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireRoles } from "../middleware/requireRoles";
import { HttpError } from "../utils/httpError";
import { makeMockPayload } from "../services/readingsMock";
import { emitReadingUpdate } from "../realtime/socket";
import { writeAuditLog } from "../services/audit";

export const readingsRouter = Router();

readingsRouter.use(requireAuth);

readingsRouter.get("/", async (req, res, next) => {
  try {
    const query = z
      .object({
        patientId: z.string().optional(),
        type: z.enum(["ECG", "BLOOD_PRESSURE", "GLUCOSE"]).optional(),
        limit: z.coerce.number().min(1).max(200).optional(),
      })
      .parse(req.query);

    const viewer = req.user;
    const patientId =
      viewer?.role === "PATIENT" ? viewer.patientId ?? undefined : query.patientId ?? undefined;

    if (viewer?.role === "PATIENT" && query.patientId && query.patientId !== viewer.patientId) {
      throw new HttpError(403, "Forbidden");
    }

    if (viewer?.role !== "PATIENT" && viewer?.role !== "ADMIN" && viewer?.role !== "DOCTOR") {
      throw new HttpError(403, "Forbidden");
    }

    const readings = await prisma.reading.findMany({
      where: {
        patientId,
        type: query.type,
      },
      orderBy: { recordedAt: "desc" },
      take: query.limit ?? 50,
      include: { patient: true, device: true },
    });

    res.json({ readings });
  } catch (e) {
    next(e);
  }
});

readingsRouter.post(
  "/patients/:patientId/readings",
  requireRoles("ADMIN", "DOCTOR", "PATIENT"),
  async (req, res, next) => {
    try {
      const patientId = z.string().parse(req.params.patientId);
      const viewer = req.user;
      if (viewer?.role === "PATIENT" && viewer.patientId !== patientId) {
        throw new HttpError(403, "Forbidden");
      }

      const body = z
        .object({
          type: z.enum(["ECG", "BLOOD_PRESSURE", "GLUCOSE"]),
          deviceId: z.string().optional(),
          recordedAt: z.string().datetime().optional(),
          payload: z.unknown().optional(),
        })
        .parse(req.body);

      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw new HttpError(404, "Patient not found");

      if (body.deviceId) {
        const device = await prisma.device.findUnique({ where: { id: body.deviceId } });
        if (!device || device.patientId !== patientId) {
          throw new HttpError(400, "Invalid device");
        }
      }

      const payload = body.payload ?? makeMockPayload(body.type);
      const reading = await prisma.reading.create({
        data: {
          type: body.type,
          patientId,
          deviceId: body.deviceId,
          recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
          payload: payload as any,
          createdByUserId: viewer?.id ?? null,
        },
        include: { patient: true, device: true },
      });

      await writeAuditLog({
        actorUserId: viewer?.id,
        action: "CREATE_READING",
        entityType: "Reading",
        entityId: reading.id,
        meta: { patientId, type: reading.type },
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });

      emitReadingUpdate(patientId, reading);
      res.status(201).json({ reading });
    } catch (e) {
      next(e);
    }
  },
);

readingsRouter.post(
  "/patients/:patientId/readings/mock",
  requireRoles("ADMIN", "DOCTOR"),
  async (req, res, next) => {
    try {
      const patientId = z.string().parse(req.params.patientId);
      const body = z
        .object({
          type: z.enum(["ECG", "BLOOD_PRESSURE", "GLUCOSE"]),
          deviceId: z.string().optional(),
        })
        .parse(req.body);

      const payload = makeMockPayload(body.type);
      const reading = await prisma.reading.create({
        data: {
          type: body.type,
          patientId,
          deviceId: body.deviceId,
          recordedAt: new Date(),
          payload: payload as any,
          createdByUserId: req.user?.id ?? null,
        },
        include: { patient: true, device: true },
      });

      await writeAuditLog({
        actorUserId: req.user?.id,
        action: "MOCK_READING",
        entityType: "Reading",
        entityId: reading.id,
        meta: { patientId, type: reading.type },
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });

      emitReadingUpdate(patientId, reading);
      res.status(201).json({ reading });
    } catch (e) {
      next(e);
    }
  },
);
