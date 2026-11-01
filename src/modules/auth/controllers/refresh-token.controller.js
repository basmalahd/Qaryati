
function createRefreshTokenController(
    refreshTokenService,
    jwtService
) {
    async function refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (typeof refreshToken !== "string" || !refreshToken) {
                return res.status(400).json({
                    message: "Refresh token is required"
                });
            }

            const result = await refreshTokenService.rotate(
                refreshToken
            );

            const accessToken = jwtService.sign({
                userId: result.userId
            });

            return res.status(200).json({
                accessToken,
                refreshToken: result.refreshToken,
                tokenType: "Bearer"
            });
        } catch (error) {
            return next(error);
        }
    }

    async function logout(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (typeof refreshToken !== "string" || !refreshToken) {
                return res.status(400).json({
                    message: "Refresh token is required"
                });
            }

            await refreshTokenService.revoke(refreshToken);

            return res.status(200).json({
                message: "Logged out successfully"
            });
        } catch (error) {
            return next(error);
        }
    }

    return { refresh, logout };
}

module.exports = { createRefreshTokenController };
