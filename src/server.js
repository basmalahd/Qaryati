
const app = require("./app");
const env = require("./config/env.config");

app.listen(env.PORT, () => {
  console.log(`Qaryati API running on port ${env.PORT}`);
});
