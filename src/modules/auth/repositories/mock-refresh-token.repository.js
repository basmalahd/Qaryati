
function createMockRefreshTokenRepository() {
    const tokens = new Map();
    let nextId = 1;

    async function create(data) {
        const token = {
            id: nextId++,
            userId: data.userId,
            tokenHash: data.tokenHash,
            expiresAt: data.expiresAt,
            revokedAt: null,
            replacedByTokenId: null
        };

        tokens.set(token.id, token);
        return { ...token };
    }

    async function findByHash(tokenHash) {
        const token = [...tokens.values()].find(
            (item) => item.tokenHash === tokenHash
        );

        return token ? { ...token } : null;
    }

    async function rotate({
                              oldTokenId,
                              userId,
                              newTokenHash,
                              newExpiresAt
                          }) {
        const oldToken = tokens.get(oldTokenId);

        if (
            !oldToken ||
            oldToken.userId !== userId ||
            oldToken.revokedAt !== null ||
            new Date(oldToken.expiresAt).getTime() <= Date.now()
        ) {
            return false;
        }

        const now = new Date();

        const newToken = {
            id: nextId++,
            userId,
            tokenHash: newTokenHash,
            expiresAt: newExpiresAt,
            revokedAt: null,
            replacedByTokenId: null
        };

        oldToken.revokedAt = now;
        oldToken.replacedByTokenId = newToken.id;

        tokens.set(newToken.id, newToken);

        return true;
    }

    async function revokeByHash(tokenHash) {
        const token = [...tokens.values()].find(
            (item) => item.tokenHash === tokenHash
        );

        if (!token || token.revokedAt !== null) {
            return false;
        }

        token.revokedAt = new Date();
        return true;
    }

    return {
        create,
        findByHash,
        rotate,
        revokeByHash
    };
}

module.exports = { createMockRefreshTokenRepository };
