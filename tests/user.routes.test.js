
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

const {
    createUserRouter
} = require("../src/modules/auth/routes/user.routes");

const {
    createMockUserRepository
} = require("../src/modules/auth/repositories/mock-user.repository");

const {
    createJwtService
} = require("../src/modules/auth/services/jwt.service");

function createTestApp() {
    const userRepository = createMockUserRepository([
        {
            id: 1,
            email: "admin@example.com",
            fullName: "Admin User",
            enabled: true,
            roles: ["Admin"]
        },
        {
            id: 2,
            email: "editor@example.com",
            fullName: "Editor User",
            enabled: true,
            roles: ["Editor"]
        }
    ]);

    const jwtService = createJwtService(
        "test-only-secret-key-at-least-32-characters-long"
    );

    const app = express();
    app.use(express.json());

    app.use(
        "/api/users",
        createUserRouter(userRepository, jwtService)
    );

    app.use((error, req, res, next) => {
        return res.status(error.status || 500).json({
            message: error.message
        });
    });

    return { app, jwtService };
}

test("GET /me requires authentication", async () => {
    const { app } = createTestApp();

    const response = await request(app).get("/api/users/me");

    assert.equal(response.status, 401);
});

test("GET /me returns the current user", async () => {
    const { app, jwtService } = createTestApp();

    const token = jwtService.sign({ userId: 2 });

    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.user.id, 2);
    assert.deepEqual(response.body.user.roles, ["Editor"]);
});

test("Editor cannot deactivate users", async () => {
    const { app, jwtService } = createTestApp();

    const token = jwtService.sign({ userId: 2 });

    const response = await request(app)
        .patch("/api/users/1/deactivate")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 403);
});

test("Admin can deactivate another user", async () => {
    const { app, jwtService } = createTestApp();

    const token = jwtService.sign({ userId: 1 });

    const response = await request(app)
        .patch("/api/users/2/deactivate")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.user.enabled, false);
});

test("Admin cannot deactivate themselves", async () => {
    const { app, jwtService } = createTestApp();

    const token = jwtService.sign({ userId: 1 });

    const response = await request(app)
        .patch("/api/users/1/deactivate")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 400);
});
