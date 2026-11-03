
const prisma = require("../../../config/prisma.config");

function toUserId(id) {
    try {
        const value = BigInt(id);
        return value > 0n ? value : null;
    } catch {
        return null;
    }
}

function mapUser(user) {
    if (!user) return null;

    return {
        id: user.id.toString(),
        fullName: user.full_name,
        email: user.email,
        passwordHash: user.password_hash,
        enabled: user.enabled,
        roles: user.userRoles.map(
            (userRole) => userRole.role.name
        )
    };
}

function createPrismaUserRepository() {
    const include = {
        userRoles: {
            include: {
                role: true
            }
        }
    };

    async function findByEmail(email) {
        const user = await prisma.user.findUnique({
            where: { email },
            include
        });

        return mapUser(user);
    }

    async function findById(id) {
        const userId = toUserId(id);
        if (userId === null) return null;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include
        });

        return mapUser(user);
    }

    async function update(id, data) {
        const userId = toUserId(id);
        if (userId === null) return null;

        const changes = {};

        if (data.fullName !== undefined) {
            changes.full_name = data.fullName;
        }

        if (data.enabled !== undefined) {
            changes.enabled = data.enabled;
        }

        if (Object.keys(changes).length === 0) {
            return findById(id);
        }

        const existingUser = await findById(id);
        if (!existingUser) return null;

        const user = await prisma.user.update({
            where: { id: userId },
            data: changes,
            include
        });

        return mapUser(user);
    }

    return {
        findByEmail,
        findById,
        update
    };
}

module.exports = { createPrismaUserRepository };
