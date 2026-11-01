
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createRefreshTokenService
} = require("../src/modules/auth/services/refresh-token.service");

const {
    createMockRefreshTokenRepository
} = require("../src/modules/auth/repositories/mock-refresh-token.repository");

const {
    createMockUserRepository
} = require("../src/modules/auth/repositories/mock-user.repository");

function createTestService() {
    const tokenRepository = createMockRefreshTokenRepository();

    const userRepository = createMockUserRepository([
        {
            id: 1,
            email: "test@example.com",
            fullName: "Test User",
            enabled: true,
            roles: ["Editor"]
        }
    ]);

    return createRefreshTokenService(
        tokenRepository,
        userRepository
    );
}

test("issues a refresh token", async () => {
    const service = createTestService();

    const token = await service.issue(1);

    assert.equal(typeof token, "string");
    assert.equal(token.length, 64);
});

test("rotates a valid refresh token", async () => {
    const service = createTestService();

    const oldToken = await service.issue(1);
    const result = await service.rotate(oldToken);

    assert.equal(result.userId, 1);
    assert.equal(typeof result.refreshToken, "string");
    assert.notEqual(result.refreshToken, oldToken);
});

test("rejects reuse of a rotated token", async () => {
    const service = createTestService();

    const oldToken = await service.issue(1);
    await service.rotate(oldToken);

    await assert.rejects(
        service.rotate(oldToken),
        /Invalid or expired refresh token/
    );
});

test("revokes a refresh token", async () => {
    const service = createTestService();

    const token = await service.issue(1);

    assert.equal(await service.revoke(token), true);

    await assert.rejects(
        service.rotate(token),
        /Invalid or expired refresh token/
    );
});

test("rejects an unknown refresh token", async () => {
    const service = createTestService();

    await assert.rejects(
        service.rotate("unknown-token"),
        /Invalid or expired refresh token/
    );
});

test("rejects concurrent reuse of the same token", async () => {
    const service = createTestService();

    const token = await service.issue(1);

    const results = await Promise.allSettled([
        service.rotate(token),
        service.rotate(token)
    ]);

    const successful = results.filter(
        (result) => result.status === "fulfilled"
    );

    const rejected = results.filter(
        (result) => result.status === "rejected"
    );

    assert.equal(successful.length, 1);
    assert.equal(rejected.length, 1);
});
