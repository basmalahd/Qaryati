const { sendProblem } = require("../shared/http/send-problem");

function createAuthenticateMiddleware(jwtService, userRepository) {
    return async function authenticate(req, res, next) {
        try {
            const authorization = req.headers.authorization;

            if (
                typeof authorization !== "string" ||
                !authorization.startsWith("Bearer ")
            ) {
                return sendProblem(req, res, 401, "Unauthorized", "Authentication required", "AUTHENTICATION_REQUIRED");
            }

            const token = authorization.slice(7).trim();

            if (!token) {
                return sendProblem(req, res, 401, "Unauthorized", "Authentication required", "AUTHENTICATION_REQUIRED");
            }

            let payload;

            try {
                payload = jwtService.verify(token);
            } catch {
                return sendProblem(req, res, 401, "Unauthorized", "Invalid or expired token", "AUTHENTICATION_REQUIRED");
            }

            const user = await userRepository.findById(payload.sub);

            if (!user || !user.enabled) {
                return sendProblem(req, res, 401, "Unauthorized", "Invalid or inactive user", "AUTHENTICATION_REQUIRED");
            }

            req.user = {
                id: user.id,
                email: user.email,
                roles: Array.isArray(user.roles) ? user.roles : []
            };

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

module.exports = { createAuthenticateMiddleware };
