
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createUserService
} = require("../src/modules/auth/services/user.service");

const {
    createMockUserRepository
} = require("../src/modules/auth/repositories/mock-user.repository");

function createTestService() {
    const repository = createMockUserRepository([
        {
            id: 1,
            email: "admin@example.com",
            fullName: "Admin User",
            enabled: true,
            roles: ["Admin"],
            passwordHash: "secret-hash"
        },
        {
            id: 2,
            email: "editor@example.com",
            fullName: "Editor User",
            enabled: true,
            roles: ["Editor"],
            passwordHash: "another-secret-hash"
        }
    ]);

    return createUserService(repository);
}

test("gets user details without password hash", async () => {
    const service = createTestService();

    const user = await service.getUserById(2);

    assert.equal(user.id, 2);
    assert.equal(user.email, "editor@example.com");
    assert.deepEqual(user.roles, ["Editor"]);
    assert.equal(user.passwordHash, undefined);
});

test("returns 404 when user does not exist", async () => {
    const service = createTestService();

    await assert.rejects(
        service.getUserById(999),
        { status: 404 }
    );
});

test("admin can deactivate another user", async () => {
    const service = createTestService();

    const result = await service.deactivateUser(2, 1);

    assert.equal(result.id, 2);
    assert.equal(result.enabled, false);

    const updatedUser = await service.getUserById(2);
    assert.equal(updatedUser.enabled, false);
});

test("rejects self-deactivation", async () => {
    const service = createTestService();

    await assert.rejects(
        service.deactivateUser(1, 1),
        { status: 400 }
    );
});

test("rejects deactivating an unknown user", async () => {
    const service = createTestService();

    await assert.rejects(
        service.deactivateUser(999, 1),
        { status: 404 }
    );
});

test("rejects deactivating an already inactive user", async () => {
    const service = createTestService();

    await service.deactivateUser(2, 1);

    await assert.rejects(
        service.deactivateUser(2, 1),
        { status: 409 }
    );
});
