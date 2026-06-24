"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_1 = require("../auth/jwt");
const prisma_1 = require("../db/prisma");
const httpError_1 = require("../utils/httpError");
async function requireAuth(req, _res, next) {
    try {
        const header = req.header("authorization") ?? "";
        const [type, token] = header.split(" ");
        if (type !== "Bearer" || !token) {
            throw new httpError_1.HttpError(401, "Unauthorized");
        }
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { patient: true },
        });
        if (!user) {
            throw new httpError_1.HttpError(401, "Unauthorized");
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            patientId: user.patient?.id ?? null,
        };
        next();
    }
    catch (e) {
        next(e);
    }
}
