
function createMockUserRepository(users = []) {
    const storedUsers = users.map((user) => ({
        ...user,
        roles: Array.isArray(user.roles) ? [...user.roles] : []
    }));

    async function findByEmail(email) {
        if (typeof email !== "string") {
            return null;
        }

        const user = storedUsers.find(
            (item) =>
                typeof item.email === "string" &&
                item.email.toLowerCase() === email.toLowerCase()
        );

        return user ? { ...user, roles: [...user.roles] } : null;
    }

    async function findById(id) {
        const user = storedUsers.find(
            (item) => String(item.id) === String(id)
        );

        return user ? { ...user, roles: [...user.roles] } : null;
    }

    async function update(id, data) {
        const user = storedUsers.find(
            (item) => String(item.id) === String(id)
        );

        if (!user) {
            return null;
        }

        const allowedFields = ["fullName", "enabled"];

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                user[field] = data[field];
            }
        }

        return { ...user, roles: [...user.roles] };
    }

    return {
        findByEmail,
        findById,
        update
    };
}

module.exports = { createMockUserRepository };
