const { sendProblem } = require("../shared/http/send-problem");
function authorize(...roleArguments) {
    const allowedRoles = roleArguments
        .flat()
        .filter((role) => typeof role === "string" && role.trim())
        .map((role) => role.trim().toUpperCase());

    if (allowedRoles.length === 0) {
        throw new Error("At least one role is required");
    }

    return function authorizeMiddleware(req, res, next) {
        if (!req.user) {
            return sendProblem(req, res, 401, "Unauthorized", "Authentication required", "AUTHENTICATION_REQUIRED");
        }

        const userRoles = Array.isArray(req.user.roles)
            ? req.user.roles
                .filter((role) => typeof role === "string")
                .map((role) => role.trim().toUpperCase())
            : [];

        const hasPermission = allowedRoles.some(
            (role) => userRoles.includes(role)
        );

        if (!hasPermission) {
            return sendProblem(req, res, 403, "Forbidden", "Access denied", "ACCESS_DENIED");
        }

        return next();
    };
}

module.exports = { authorize };
