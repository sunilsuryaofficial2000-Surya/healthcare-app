import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireRoles } from "../middleware/requireRoles";
import { HttpError } from "../utils/httpError";
import { writeAuditLog } from "../services/audit";

export const patientsRouter = Router();

patientsRouter.use(requireAuth);

patientsRouter.get("/", requireRoles("ADMIN", "DOCTOR"), async (_req, res) => {
  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  res.json({ patients });
});

patientsRouter.post("/", requireRoles("ADMIN", "DOCTOR"), async (req, res, next) => {
  try {
    const body = z
      .object({
        mrn: z.string().min(1),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string().datetime().optional(),
        gender: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
      })
      .parse(req.body);

    const patient = await prisma.patient.create({
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

    await writeAuditLog({
      actorUserId: req.user?.id,
      action: "CREATE_PATIENT",
      entityType: "Patient",
      entityId: patient.id,
      meta: { mrn: patient.mrn },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({ patient });
  } catch (e) {
    next(e);
  }
});

patientsRouter.get("/:patientId", async (req, res, next) => {
  try {
    const patientId = z.string().parse(req.params.patientId);
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { devices: true },
    });
    if (!patient) throw new HttpError(404, "Patient not found");

    const viewer = req.user;
    if (viewer?.role === "PATIENT" && viewer.patientId !== patientId) {
      throw new HttpError(403, "Forbidden");
    }

    res.json({ patient });
  } catch (e) {
    next(e);
  }
});

patientsRouter.put("/:patientId", requireRoles("ADMIN", "DOCTOR"), async (req, res, next) => {
  try {
    const patientId = z.string().parse(req.params.patientId);
    const body = z
      .object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        dateOfBirth: z.string().datetime().nullable().optional(),
        gender: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        email: z.string().email().nullable().optional(),
        address: z.string().nullable().optional(),
      })
      .parse(req.body);

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        firstName: body.firstName ?? undefined,
        lastName: body.lastName ?? undefined,
        dateOfBirth:
          body.dateOfBirth === undefined ? undefined : body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender === undefined ? undefined : body.gender,
        phone: body.phone === undefined ? undefined : body.phone,
        email: body.email === undefined ? undefined : body.email,
        address: body.address === undefined ? undefined : body.address,
      },
    });

    await writeAuditLog({
      actorUserId: req.user?.id,
      action: "UPDATE_PATIENT",
      entityType: "Patient",
      entityId: patient.id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ patient });
  } catch (e) {
    next(e);
  }
});
