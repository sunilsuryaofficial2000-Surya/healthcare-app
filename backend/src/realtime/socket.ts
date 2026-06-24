import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../auth/jwt";

let io: Server | null = null;

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    try {
      const header = socket.handshake.headers.authorization ?? "";
      const authToken =
        socket.handshake.auth?.token && typeof socket.handshake.auth.token === "string"
          ? socket.handshake.auth.token
          : undefined;
      const tokenFromHeader = header.startsWith("Bearer ") ? header.slice(7) : undefined;
      const token = authToken ?? tokenFromHeader;
      if (!token) {
        next(new Error("Unauthorized"));
        return;
      }

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { patient: true },
      });
      if (!user) {
        next(new Error("Unauthorized"));
        return;
      }

      socket.data.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        patientId: user.patient?.id ?? null,
      };

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("patient:subscribe", async (patientId: string) => {
      const user = socket.data.user as any;
      if (user?.role === "PATIENT" && user.patientId !== patientId) {
        return;
      }
      await socket.join(`patient:${patientId}`);
    });

    socket.on("patient:unsubscribe", async (patientId: string) => {
      await socket.leave(`patient:${patientId}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("socket.io not initialized");
  }
  return io;
}

export function emitReadingUpdate(patientId: string, reading: unknown) {
  if (!io) return;
  io.to(`patient:${patientId}`).emit("reading:new", reading);
  io.emit("reading:new:global", reading);
}
