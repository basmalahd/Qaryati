
const prisma = require("../../../config/prisma.config");

function toBigInt(id) {
    try {
        const value = BigInt(id);
        if (value <= 0n) {
            throw new Error("Invalid ID");
        }
        return value;
    } catch {
        throw new Error("Invalid ID");
    }
}

function mapToken(token) {
    if (!token) return null;

    return {
        id: token.id.toString(),
        userId: token.user_id.toString(),
        tokenHash: token.token_hash,
        expiresAt: token.expires_at,
        revokedAt: token.revoked_at,
        createdAt: token.created_at,
        replacedByTokenId:
            token.replaced_by_token_id?.toString() ?? null
    };
}

function createPrismaRefreshTokenRepository() {
    async function create(data) {
        const token = await prisma.refreshToken.create({
            data: {
                user_id: toBigInt(data.userId),
                token_hash: data.tokenHash,
                expires_at: data.expiresAt
            }
        });

        return mapToken(token);
    }

    async function findByHash(tokenHash) {
        const token = await prisma.refreshToken.findUnique({
            where: { token_hash: tokenHash }
        });

        return mapToken(token);
    }

    async function rotate(oldTokenHash, newTokenData) {
        return prisma.$transaction(async (tx) => {
            const now = new Date();

            const updated = await tx.refreshToken.updateMany({
                where: {
                    token_hash: oldTokenHash,
                    revoked_at: null,
                    expires_at: { gt: now }
                },
                data: {
                    revoked_at: now
                }
            });

            if (updated.count !== 1) {
                return null;
            }

            const oldToken = await tx.refreshToken.findUnique({
                where: { token_hash: oldTokenHash }
            });

            const newToken = await tx.refreshToken.create({
                data: {
                    user_id: oldToken.user_id,
                    token_hash: newTokenData.tokenHash,
                    expires_at: newTokenData.expiresAt
                }
            });

            await tx.refreshToken.update({
                where: { id: oldToken.id },
                data: {
                    replaced_by_token_id: newToken.id
                }
            });

            return mapToken(newToken);
        });
    }

    async function revokeByHash(tokenHash) {
        const result = await prisma.refreshToken.updateMany({
            where: {
                token_hash: tokenHash,
                revoked_at: null
            },
            data: {
                revoked_at: new Date()
            }
        });

        return result.count === 1;
    }

    return {
        create,
        findByHash,
        rotate,
        revokeByHash
    };
}

module.exports = {
    createPrismaRefreshTokenRepository
};
