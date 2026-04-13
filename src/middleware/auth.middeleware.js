import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { userModel } from "../db/models/user.models.js";
import redisClient from "../utils/redisclient.js";


dotenv.config({
  path: "./config/.env.development",
});

export const verifyTokenMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }
    const isBlackListed = await redisClient.get(`blacklist_${token}`);
    if (isBlackListed) {
      return res.status(401).json({ message: "Token is blacklisted" });
    }
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
export const authentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new Error("Authorization header is required", {
        cause: { status: 400 },
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new Error("Token is required", { cause: { status: 400 } });
    }

    // Check if token is blacklisted (single device logout via Redis)
    const isBlacklisted = await redisClient.get(`blacklist_${token}`);
    if (isBlacklisted) {
      throw new Error("Token has been invalidated, please login again", {
        cause: { status: 401 },
      });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    // Check tokenVersion (logout from all devices)
    const user = await userModel.findById(decoded._id).select("tokenVersion");

    if (!user) {
      throw new Error("User not found", { cause: { status: 404 } });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new Error("Session expired, please login again", {
        cause: { status: 401 },
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
