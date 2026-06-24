import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { signAccessToken } from "../auth/jwt";
import { hashPassword, verifyPassword } from "../auth/password";
import { requireAuth } from "../middleware/requireAuth";
import { requireRoles } from "../middleware/requireRoles";
import { HttpError } from "../utils/httpError";
import { writeAuditLog } from "../services/audit";

export const authRouter = Router();

authRouter.post("/bootstrap", async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
      })
      .parse(req.body);

    const userCount = await prisma.user.count();
    if (userCount > 0) {
      throw new HttpError(409, "Bootstrap is disabled");
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: await hashPassword(body.password),
        role: "ADMIN",
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "BOOTSTRAP_ADMIN",
      entityType: "User",
      entityId: user.id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { patient: true },
    });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      patientId: user.patient?.id ?? null,
    });

    await writeAuditLog({
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
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

authRouter.post("/register", requireAuth, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["ADMIN", "DOCTOR", "PATIENT"]),
        patient: z
          .object({
            mrn: z.string().min(1),
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            gender: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().email().optional(),
            address: z.string().optional(),
          })
          .optional(),
      })
      .parse(req.body);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: await hashPassword(body.password),
        role: body.role,
        patient:
          body.role === "PATIENT" && body.patient
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

    await writeAuditLog({
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
  } catch (e) {
    next(e);
  }
});
