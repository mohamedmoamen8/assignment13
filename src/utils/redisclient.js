import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config({ path: "./config/.env.development" });

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

let errorLogged = false;
redisClient.on("error", (err) => {
  if (!errorLogged) {
    console.error("Redis error:", err.message);
    errorLogged = true;
  }
});

redisClient.on("connect", () => {
  errorLogged = false; // reset if reconnects successfully
  console.log("Redis connected");
});

await redisClient.connect();

export default redisClient;