
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

test("GET /api/v1/health returns 200 OK", async () => {
  const response = await request(app)
    .get("/api/v1/health");

  assert.equal(response.status, 200);

  assert.deepEqual(response.body, {
    status: "OK",
    message: "Qaryati API is running"
  });
});

test("Unknown endpoint returns 404 Problem Details", async () => {
  const response = await request(app)
    .get("/api/v1/not-found");

  assert.equal(response.status, 404);

  assert.match(
    response.headers["content-type"],
    /application\/problem\+json/
  );

  assert.deepEqual(response.body, {
    type: "about:blank",
    title: "Request Error",
    status: 404,
    detail: "The requested endpoint does not exist.",
    instance: "/api/v1/not-found"
  });
});
