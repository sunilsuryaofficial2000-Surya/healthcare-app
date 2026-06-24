import { Router } from "express";
import { authRouter } from "./auth";
import { patientsRouter } from "./patients";
import { devicesRouter } from "./devices";
import { readingsRouter } from "./readings";
import { dashboardRouter } from "./dashboard";
import { auditLogsRouter } from "./auditLogs";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/patients", patientsRouter);
apiRouter.use("/devices", devicesRouter);
apiRouter.use("/", readingsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/audit-logs", auditLogsRouter);
