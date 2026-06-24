import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth/jwt";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpError";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization") ?? "";
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      throw new HttpError(401, "Unauthorized");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { patient: true },
    });
    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      patientId: user.patient?.id ?? null,
    };

    next();
  } catch (e) {
    next(e);
  }
}
