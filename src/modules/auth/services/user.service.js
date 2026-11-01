
function createUserService(userRepository, passwordService) {
    async function getUserById(id) {
        const user = await userRepository.findById(id);

        if (!user) {
            const error = new Error("User not found");
            error.status = 404;
            throw error;
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            enabled: user.enabled,
            roles: Array.isArray(user.roles) ? user.roles : []
        };
    }

    async function deactivateUser(id, currentUserId) {
        if (String(id) === String(currentUserId)) {
            const error = new Error("You cannot deactivate yourself");
            error.status = 400;
            throw error;
        }

        const user = await userRepository.findById(id);

        if (!user) {
            const error = new Error("User not found");
            error.status = 404;
            throw error;
        }

        if (!user.enabled) {
            const error = new Error("User is already deactivated");
            error.status = 409;
            throw error;
        }

        const updatedUser = await userRepository.update(id, {
            enabled: false
        });

        return {
            id: updatedUser.id,
            email: updatedUser.email,
            enabled: updatedUser.enabled
        };
    }

    return {
        getUserById,
        deactivateUser
    };
}

module.exports = { createUserService };
