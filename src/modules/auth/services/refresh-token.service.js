
const crypto = require("node:crypto");

function createRefreshTokenService(
    tokenRepository,
    userRepository
) {
    const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

    function createError(message) {
        const error = new Error(message);
        error.status = 401;
        return error;
    }

    function hashToken(token) {
        return crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");
    }

    async function issue(userId) {
        const user = await userRepository.findById(userId);

        if (!user || !user.enabled) {
            throw createError("Invalid or inactive user");
        }

        const token = crypto.randomBytes(32).toString("hex");

        await tokenRepository.create({
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
            revokedAt: null
        });

        return token;
    }

    async function rotate(oldToken) {
        if (typeof oldToken !== "string" || !oldToken) {
            throw createError("Invalid refresh token");
        }

        const storedToken = await tokenRepository.findByHash(
            hashToken(oldToken)
        );

        if (
            !storedToken ||
            storedToken.revokedAt ||
            new Date(storedToken.expiresAt).getTime() <= Date.now()
        ) {
            throw createError("Invalid or expired refresh token");
        }

        const user = await userRepository.findById(
            storedToken.userId
        );

        if (!user || !user.enabled) {
            throw createError("Invalid or inactive user");
        }

        const newToken = crypto.randomBytes(32).toString("hex");

        const rotated = await tokenRepository.rotate(
            hashToken(oldToken),
            {
                tokenHash: hashToken(newToken),
                expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS)
            }
        );

        if (!rotated) {
            throw createError("Refresh token already used or revoked");
        }

        return {
            refreshToken: newToken,
            userId: user.id
        };
    }

    async function revoke(token) {
        if (typeof token !== "string" || !token) {
            return false;
        }

        return tokenRepository.revokeByHash(hashToken(token));
    }

    return { issue, rotate, revoke };
}

module.exports = { createRefreshTokenService };
