import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  patientId?: string | null;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if ((process.env.NODE_ENV ?? "").toLowerCase() !== "production") {
    return "dev_jwt_secret_change_me";
  }
  throw new Error("JWT_SECRET is required");
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
