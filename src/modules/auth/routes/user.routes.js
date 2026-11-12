const express = require("express");

const {
    createUserController
} = require("../controllers/user.controller");

const {
    createUserService
} = require("../services/user.service");

const {
    createPasswordService
} = require("../services/password.service");

const {
    createAuthenticateMiddleware
} = require("../../../middleware/authenticate.middleware");

const {
    authorize
} = require("../../../middleware/authorize.middleware");

function createUserRouter(options = {}, legacyJwtService) {
    // Preserve the positional signature used by existing callers.
    const userRepository = legacyJwtService ? options : options.userRepository;
    const jwtService = legacyJwtService || options.jwtService;

    if (!userRepository || !jwtService) {
        throw new Error("User repository and JWT service are required");
    }

    const router = express.Router();
    const passwordService = createPasswordService();
    const userService = createUserService(userRepository, passwordService);
    const userController = createUserController(userService);
    const authenticate = createAuthenticateMiddleware(jwtService, userRepository);

    router.get("/me", authenticate, userController.getMe);
    router.patch("/:id/deactivate", authenticate, authorize("Admin"), userController.deactivateUser);

    return router;
}

module.exports = { createUserRouter };
