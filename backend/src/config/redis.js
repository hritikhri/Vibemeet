const { createClient } = require ("redis");
require("dotenv").config();

const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", (err) => {
  console.log(err)
});

client.on("connect", () => {
  console.log("✅ Redis connected");
});

module.exports= client;