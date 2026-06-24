"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
const httpError_1 = require("../utils/httpError");
function requireRoles(...roles) {
    return function requireRolesMiddleware(req, _res, next) {
        try {
            const role = req.user?.role;
            if (!role || !roles.includes(role)) {
                throw new httpError_1.HttpError(403, "Forbidden");
            }
            next();
        }
        catch (e) {
            next(e);
        }
    };
}
