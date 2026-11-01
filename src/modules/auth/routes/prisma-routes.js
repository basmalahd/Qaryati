
const express = require("express");

const {
    createAuthRouter
} = require("./auth.routes");

const {
    createUserRouter
} = require("./user.routes");

const {
    createPrismaUserRepository
} = require("../repositories/prisma-user.repository");

const {
    createPrismaRefreshTokenRepository
} = require("../repositories/prisma-refresh-token.repository");

const {
    createJwtService
} = require("../services/jwt.service");

function createPrismaRoutes() {
    const router = express.Router();

    const userRepository = createPrismaUserRepository();

    const tokenRepository =
        createPrismaRefreshTokenRepository();

    const jwtService = createJwtService(
        process.env.JWT_ACCESS_SECRET
    );

    router.use(
        "/auth",
        createAuthRouter({
            userRepository,
            tokenRepository,
            jwtService
        })
    );

    router.use(
        "/users",
        createUserRouter({
            userRepository,
            jwtService
        })
    );

    return router;
}

module.exports = {
    createPrismaRoutes
};
