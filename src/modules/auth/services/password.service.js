
const { scrypt, randomBytes, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);

function createPasswordService() {
    async function hash(password) {
        const salt = randomBytes(16).toString("hex");
        const derivedKey = await scryptAsync(password, salt, 64);

        return `${salt}:${derivedKey.toString("hex")}`;
    }

    async function compare(password, storedHash) {
        if (
            typeof password !== "string" ||
            typeof storedHash !== "string"
        ) {
            return false;
        }

        const parts = storedHash.split(":");

        if (parts.length !== 2) {
            return false;
        }

        const [salt, hashHex] = parts;

        if (
            !/^[a-f0-9]{32}$/i.test(salt) ||
            !/^[a-f0-9]{128}$/i.test(hashHex)
        ) {
            return false;
        }

        const storedKey = Buffer.from(hashHex, "hex");
        const derivedKey = await scryptAsync(
            password,
            salt,
            storedKey.length
        );

        return timingSafeEqual(storedKey, derivedKey);
    }

    return { hash, compare };
}

module.exports = { createPasswordService };
