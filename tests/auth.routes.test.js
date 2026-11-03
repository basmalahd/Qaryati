
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

const {
    createAuthRouter
} = require("../src/modules/auth/routes/auth.routes");

const {
    createMockUserRepository
} = require("../src/modules/auth/repositories/mock-user.repository");

const {
    createMockRefreshTokenRepository
} = require("../src/modules/auth/repositories/mock-refresh-token.repository");

const {
    createPasswordService
} = require("../src/modules/auth/services/password.service");

const {
    createJwtService
} = require("../src/modules/auth/services/jwt.service");

async function createTestApp() {
    const passwordService = createPasswordService();
    const passwordHash = await passwordService.hash("Password123!");

    const userRepository = createMockUserRepository([
        {
            id: 1,
            email: "student@example.com",
            fullName: "Test Student",
            passwordHash,
            enabled: true,
            roles: ["Editor"]
        }
    ]);

    const tokenRepository = createMockRefreshTokenRepository();

    const jwtService = createJwtService(
        "test-only-secret-key-at-least-32-characters-long"
    );

    const app = express();
    app.use(express.json());

    app.use(
        "/api/auth",
        createAuthRouter({
            userRepository,
            tokenRepository,
            jwtService
        })
    );

    app.use((error, req, res, next) => {
        return res.status(error.status || 500).json({
            message: error.message
        });
    });

    return app;
}

test("login returns access and refresh tokens", async () => {
    const app = await createTestApp();

    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: "student@example.com",
            password: "Password123!"
        });

    assert.equal(response.status, 200);
    assert.equal(typeof response.body.accessToken, "string");
    assert.equal(typeof response.body.refreshToken, "string");
});

test("refresh returns new tokens", async () => {
    const app = await createTestApp();

    const login = await request(app)
        .post("/api/auth/login")
        .send({
            email: "student@example.com",
            password: "Password123!"
        });

    const response = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken: login.body.refreshToken
        });

    assert.equal(response.status, 200);
    assert.equal(typeof response.body.accessToken, "string");
    assert.notEqual(
        response.body.refreshToken,
        login.body.refreshToken
    );
});

test("logout revokes the refresh token", async () => {
    const app = await createTestApp();

    const login = await request(app)
        .post("/api/auth/login")
        .send({
            email: "student@example.com",
            password: "Password123!"
        });

    const logout = await request(app)
        .post("/api/auth/logout")
        .send({
            refreshToken: login.body.refreshToken
        });

    assert.equal(logout.status, 200);

    const refresh = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken: login.body.refreshToken
        });

    assert.equal(refresh.status, 401);
});
