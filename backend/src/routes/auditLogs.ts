import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireRoles } from "../middleware/requireRoles";

export const auditLogsRouter = Router();

auditLogsRouter.use(requireAuth, requireRoles("ADMIN", "DOCTOR"));

auditLogsRouter.get("/", async (req, res, next) => {
  try {
    const query = z
      .object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        limit: z.coerce.number().min(1).max(200).optional(),
      })
      .parse(req.query);

    const logs = await prisma.auditLog.findMany({
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
  } catch (e) {
    next(e);
  }
});
