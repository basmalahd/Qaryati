
const { z } = require("zod");

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1, "Password is required")
}).strict();

module.exports = {
    loginSchema
};
