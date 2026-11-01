
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createAuthService
} = require("../src/modules/auth/services/auth.service");

const {
    createMockUserRepository
} = require("../src/modules/auth/repositories/mock-user.repository");

const {
    createPasswordService
} = require("../src/modules/auth/services/password.service");

const {
    createJwtService
} = require("../src/modules/auth/services/jwt.service");

const passwordService = createPasswordService();

const jwtService = createJwtService(
    "test-only-secret-key-at-least-32-characters-long"
);

async function createTestService(enabled = true) {
    const passwordHash = await passwordService.hash("Password123!");

    const userRepository = createMockUserRepository([
        {
            id: 1,
            email: "student@example.com",
            fullName: "Test Student",
            passwordHash,
            enabled
        }
    ]);

    return createAuthService(
        userRepository,
        passwordService,
        jwtService
    );
}

test("login succeeds and returns a valid JWT", async () => {
    const authService = await createTestService();

    const result = await authService.login(
        "student@example.com",
        "Password123!"
    );

    assert.equal(result.user.id, 1);
    assert.equal(result.user.email, "student@example.com");
    assert.equal(result.user.passwordHash, undefined);
    assert.equal(result.tokenType, "Bearer");
    assert.equal(typeof result.accessToken, "string");

    const payload = jwtService.verify(result.accessToken);

    assert.equal(payload.sub, "1");
});

test("login rejects an incorrect password", async () => {
    const authService = await createTestService();

    await assert.rejects(
        authService.login("student@example.com", "WrongPassword"),
        { status: 401 }
    );
});

test("login rejects a deactivated user", async () => {
    const authService = await createTestService(false);

    await assert.rejects(
        authService.login("student@example.com", "Password123!"),
        { status: 401 }
    );
});

test("login rejects a missing user", async () => {
    const authService = createAuthService(
        createMockUserRepository(),
        passwordService,
        jwtService
    );

    await assert.rejects(
        authService.login("missing@example.com", "Password123!"),
        { status: 401 }
    );
});

test("login rejects missing credentials", async () => {
    const authService = await createTestService();

    await assert.rejects(
        authService.login("", ""),
        { status: 400 }
    );
});
