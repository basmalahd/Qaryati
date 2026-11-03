
function createUserController(userService) {
    async function getMe(req, res, next) {
        try {
            const user = await userService.getUserById(
                req.user.id
            );

            return res.status(200).json({ user });
        } catch (error) {
            return next(error);
        }
    }

    async function deactivateUser(req, res, next) {
        try {
            const user = await userService.deactivateUser(
                req.params.id,
                req.user.id
            );

            return res.status(200).json({
                message: "User deactivated successfully",
                user
            });
        } catch (error) {
            return next(error);
        }
    }

    return {
        getMe,
        deactivateUser
    };
}

module.exports = { createUserController };
