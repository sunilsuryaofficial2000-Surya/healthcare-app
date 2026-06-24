import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { HttpError } from "../utils/httpError";

export function requireRoles(...roles: Role[]) {
  return function requireRolesMiddleware(req: Request, _res: Response, next: NextFunction) {
    try {
      const role = req.user?.role;
      if (!role || !roles.includes(role)) {
        throw new HttpError(403, "Forbidden");
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
