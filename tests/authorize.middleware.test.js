
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    authorize
} = require("../src/middleware/authorize.middleware");

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

function runMiddleware(middleware, user) {
    const req = { user };
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    return { res, nextCalled };
}

test("allows Editor to access Editor routes", () => {
    const middleware = authorize("Editor");

    const result = runMiddleware(middleware, {
        id: 1,
        roles: ["Editor"]
    });

    assert.equal(result.nextCalled, true);
});

test("allows Admin to access routes that permit Admin", () => {
    const middleware = authorize("Editor", "Admin");

    const result = runMiddleware(middleware, {
        id: 2,
        roles: ["Admin"]
    });

    assert.equal(result.nextCalled, true);
});

test("rejects a user without the required role", () => {
    const middleware = authorize("Verifier");

    const result = runMiddleware(middleware, {
        id: 3,
        roles: ["Editor"]
    });

    assert.equal(result.res.statusCode, 403);
    assert.equal(result.nextCalled, false);
});

test("rejects unauthenticated requests", () => {
    const middleware = authorize("Editor");

    const result = runMiddleware(middleware, undefined);

    assert.equal(result.res.statusCode, 401);
    assert.equal(result.nextCalled, false);
});

test("rejects users with no roles", () => {
    const middleware = authorize("Admin");

    const result = runMiddleware(middleware, {
        id: 4,
        roles: []
    });

    assert.equal(result.res.statusCode, 403);
    assert.equal(result.nextCalled, false);
});

test("requires at least one allowed role", () => {
    assert.throws(
        () => authorize(),
        /At least one role is required/
    );
});
