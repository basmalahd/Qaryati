
function createAuthenticateMiddleware(jwtService, userRepository) {
    return async function authenticate(req, res, next) {
        try {
            const authorization = req.headers.authorization;

            if (
                typeof authorization !== "string" ||
                !authorization.startsWith("Bearer ")
            ) {
                return res.status(401).json({
                    message: "Authentication required"
                });
            }

            const token = authorization.slice(7).trim();

            if (!token) {
                return res.status(401).json({
                    message: "Authentication required"
                });
            }

            let payload;

            try {
                payload = jwtService.verify(token);
            } catch {
                return res.status(401).json({
                    message: "Invalid or expired token"
                });
            }

            const user = await userRepository.findById(payload.sub);

            if (!user || !user.enabled) {
                return res.status(401).json({
                    message: "Invalid or inactive user"
                });
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
