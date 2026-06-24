"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
const prisma_1 = require("../db/prisma");
async function writeAuditLog(input) {
    await prisma_1.prisma.auditLog.create({
        data: {
            actorUserId: input.actorUserId ?? null,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId ?? null,
            meta: input.meta ? input.meta : undefined,
            ip: input.ip ?? null,
            userAgent: input.userAgent ?? null,
        },
    });
}
