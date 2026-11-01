
function createAuthController(authService) {
    async function login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await authService.login(
                email,
                password
            );

            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    }

    return {
        login
    };
}

module.exports = {
    createAuthController
};
