
function authorize(...allowedRoles) {
    if (allowedRoles.length === 0) {
        throw new Error("At least one role is required");
    }

    return function authorizeMiddleware(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const userRoles = Array.isArray(req.user.roles)
            ? req.user.roles
            : [];

        const hasPermission = allowedRoles.some(
            (role) => userRoles.includes(role)
        );

        if (!hasPermission) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        return next();
    };
}

module.exports = { authorize };
