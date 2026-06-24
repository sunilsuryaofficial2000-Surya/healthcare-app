"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRealtime = initRealtime;
exports.getIO = getIO;
exports.emitReadingUpdate = emitReadingUpdate;
const socket_io_1 = require("socket.io");
const prisma_1 = require("../db/prisma");
const jwt_1 = require("../auth/jwt");
let io = null;
function initRealtime(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
        },
    });
    io.use(async (socket, next) => {
        try {
            const header = socket.handshake.headers.authorization ?? "";
            const authToken = socket.handshake.auth?.token && typeof socket.handshake.auth.token === "string"
                ? socket.handshake.auth.token
                : undefined;
            const tokenFromHeader = header.startsWith("Bearer ") ? header.slice(7) : undefined;
            const token = authToken ?? tokenFromHeader;
            if (!token) {
                next(new Error("Unauthorized"));
                return;
            }
            const payload = (0, jwt_1.verifyAccessToken)(token);
            const user = await prisma_1.prisma.user.findUnique({
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
        }
        catch {
            next(new Error("Unauthorized"));
        }
    });
    io.on("connection", (socket) => {
        socket.on("patient:subscribe", async (patientId) => {
            const user = socket.data.user;
            if (user?.role === "PATIENT" && user.patientId !== patientId) {
                return;
            }
            await socket.join(`patient:${patientId}`);
        });
        socket.on("patient:unsubscribe", async (patientId) => {
            await socket.leave(`patient:${patientId}`);
        });
    });
    return io;
}
function getIO() {
    if (!io) {
        throw new Error("socket.io not initialized");
    }
    return io;
}
function emitReadingUpdate(patientId, reading) {
    if (!io)
        return;
    io.to(`patient:${patientId}`).emit("reading:new", reading);
    io.emit("reading:new:global", reading);
}
