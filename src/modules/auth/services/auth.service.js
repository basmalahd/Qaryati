
function createAuthService(
    userRepository,
    passwordService,
    jwtService,
    refreshTokenService
) {
    async function login(email, password) {
        if (!email || !password) {
            const error = new Error("Email and password are required");
            error.status = 400;
            throw error;
        }

        const user = await userRepository.findByEmail(email);

        if (!user || !user.enabled) {
            const error = new Error("Invalid email or password");
            error.status = 401;
            throw error;
        }

        const isPasswordValid = await passwordService.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            const error = new Error("Invalid email or password");
            error.status = 401;
            throw error;
        }

        const accessToken = jwtService.sign({
            userId: user.id
        });

        const refreshToken = refreshTokenService
            ? await refreshTokenService.issue(user.id)
            : undefined;

        return {
            accessToken,
            ...(refreshToken ? { refreshToken } : {}),
            tokenType: "Bearer",
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            }
        };
    }

    return { login };
}

module.exports = { createAuthService };
