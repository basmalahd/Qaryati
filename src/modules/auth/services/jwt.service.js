
const crypto = require("node:crypto");

function createJwtService(secret) {
    if (typeof secret !== "string" || secret.length < 32) {
        throw new Error("JWT secret must be at least 32 characters");
    }

    function encode(value) {
        return Buffer.from(JSON.stringify(value)).toString("base64url");
    }

    function sign(payload) {
        const userId = String(payload?.userId ?? "");

        if (!/^[1-9]\d*$/.test(userId)) {
            throw new Error("Invalid user ID");
        }

        const header = {
            alg: "HS256",
            typ: "JWT"
        };

        const now = Math.floor(Date.now() / 1000);

        const body = {
            sub: userId,
            iat: now,
            exp: now + 15 * 60
        };

        const unsignedToken = `${encode(header)}.${encode(body)}`;

        const signature = crypto
            .createHmac("sha256", secret)
            .update(unsignedToken)
            .digest("base64url");

        return `${unsignedToken}.${signature}`;
    }

    function verify(token) {
        if (typeof token !== "string") {
            throw new Error("Invalid token");
        }

        const parts = token.split(".");

        if (parts.length !== 3) {
            throw new Error("Invalid token");
        }

        const [encodedHeader, encodedPayload, signature] = parts;

        const unsignedToken = `${encodedHeader}.${encodedPayload}`;

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(unsignedToken)
            .digest();

        let receivedSignature;

        try {
            receivedSignature = Buffer.from(signature, "base64url");
        } catch {
            throw new Error("Invalid token");
        }

        if (
            receivedSignature.length !== expectedSignature.length ||
            !crypto.timingSafeEqual(receivedSignature, expectedSignature)
        ) {
            throw new Error("Invalid token");
        }

        let header;
        let payload;

        try {
            header = JSON.parse(
                Buffer.from(encodedHeader, "base64url").toString("utf8")
            );

            payload = JSON.parse(
                Buffer.from(encodedPayload, "base64url").toString("utf8")
            );
        } catch {
            throw new Error("Invalid token");
        }

        const now = Math.floor(Date.now() / 1000);

        if (
            !header ||
            header.alg !== "HS256" ||
            header.typ !== "JWT" ||
            !payload ||
            typeof payload.sub !== "string" ||
            !/^[1-9]\d*$/.test(payload.sub) ||
            !Number.isInteger(payload.iat) ||
            !Number.isInteger(payload.exp) ||
            payload.iat > now ||
            payload.exp <= now ||
            payload.exp <= payload.iat
        ) {
            throw new Error("Invalid token");
        }

        return payload;
    }

    return {
        sign,
        verify
    };
}

module.exports = {
    createJwtService
};
