
const express = require("express");

const {
    createAuthController
} = require("../controllers/auth.controller");

const {
    createRefreshTokenController
} = require("../controllers/refresh-token.controller");

const {
    createAuthService
} = require("../services/auth.service");

const {
    createRefreshTokenService
} = require("../services/refresh-token.service");

const {
    createMockUserRepository
} = require("../repositories/mock-user.repository");

const {
    createPasswordService
} = require("../services/password.service");

const {
    createJwtService
} = require("../services/jwt.service");

const {
    loginSchema
} = require("../validation/auth.validation");

function createAuthRouter({
                              userRepository = createMockUserRepository(),
                              tokenRepository,
                              jwtService
                          } = {}) {
    if (!jwtService) {
        jwtService = createJwtService(
            process.env.JWT_ACCESS_SECRET
        );
    }

    const router = express.Router();
    const passwordService = createPasswordService();

    const refreshTokenService = tokenRepository
        ? createRefreshTokenService(
            tokenRepository,
            userRepository
        )
        : null;

    const authService = createAuthService(
        userRepository,
        passwordService,
        jwtService,
        refreshTokenService
    );

    const authController = createAuthController(authService);

    router.post("/login", (req, res, next) => {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                message: "Invalid login data"
            });
        }

        req.body = validation.data;

        return authController.login(req, res, next);
    });

    if (refreshTokenService) {
        const refreshController = createRefreshTokenController(
            refreshTokenService,
            jwtService
        );

        router.post("/refresh", refreshController.refresh);
        router.post("/logout", refreshController.logout);
    }

    return router;
}

function createPrismaAuthRouter() {
    const {
        createPrismaUserRepository
    } = require("../repositories/prisma-user.repository");

    const {
        createPrismaRefreshTokenRepository
    } = require("../repositories/prisma-refresh-token.repository");

    return createAuthRouter({
        userRepository: createPrismaUserRepository(),
        tokenRepository: createPrismaRefreshTokenRepository()
    });
}

module.exports = {
    createAuthRouter,
    createPrismaAuthRouter
};
