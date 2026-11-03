
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    createAuthenticateMiddleware
} = require("../src/middleware/authenticate.middleware");

const {
    createJwtService
} = require("../src/modules/auth/services/jwt.service");

const {
    createMockUserRepository
} = require("../src/modules/auth/repositories/mock-user.repository");

const jwtService = createJwtService(
    "test-only-secret-key-at-least-32-characters-long"
);

function createTestMiddleware(enabled = true) {
    const userRepository = createMockUserRepository([
        {
            id: 1,
            email: "student@example.com",
            enabled
        }
    ]);

    return createAuthenticateMiddleware(
        jwtService,
        userRepository
    );
}

function createResponse() {
    return {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        }
    };
}

test("accepts a valid token", async () => {
    const middleware = createTestMiddleware();
    const token = jwtService.sign({ userId: 1 });

    const req = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };

    const res = createResponse();
    let nextCalled = false;

    await middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 1);
});

test("rejects a missing token", async () => {
    const middleware = createTestMiddleware();

    const req = { headers: {} };
    const res = createResponse();

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 401);
});

test("rejects an invalid token", async () => {
    const middleware = createTestMiddleware();

    const req = {
        headers: {
            authorization: "Bearer invalid.token.value"
        }
    };

    const res = createResponse();

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 401);
});

test("rejects a deactivated user", async () => {
    const middleware = createTestMiddleware(false);
    const token = jwtService.sign({ userId: 1 });

    const req = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };

    const res = createResponse();

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 401);
});
