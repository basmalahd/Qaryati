
const {
    createAuthRouter
} = require("./auth.routes");

const {
    createPrismaUserRepository
} = require("../repositories/prisma-user.repository");

const {
    createPrismaRefreshTokenRepository
} = require("../repositories/prisma-refresh-token.repository");

function createPrismaAuthRouter() {
    return createAuthRouter({
        userRepository: createPrismaUserRepository(),
        tokenRepository: createPrismaRefreshTokenRepository()
    });
}

module.exports = { createPrismaAuthRouter };
