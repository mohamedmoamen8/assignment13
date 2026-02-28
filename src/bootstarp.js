import express from "express";
import "dotenv/config";
import messRouter from "./modules/messageModule/mes.controller.js";
import userRouter from "./modules/userModule/user.controller.js";
import authRouter from "./modules/authModule/auth.controller.js";
import { DbConnection } from "./db/db.connection.js";
import cors from "cors"
export const bootstrap = async () => {
  DbConnection();
  const app = express();
  app.use(express.json());
  const PORT = 3000;
app.use(cors())
  app.use("/user", userRouter);
  app.use("/message", messRouter);
  app.use("/auth", authRouter);
  app.use("/uploads", express.static("uploads"));

  app.all("{/*dummy}", (req, res) => {
    throw new Error(`invalid url ${req.path} with method ${req.method}`, {
      cause: {
        status: 400,
      },
    });
  });

  app.use((err, req, res, next) => {
    if (err) {
      return res.status(err.cause?.status || 500).json({
        errMsg: err.message,
      });
    }
  });

  app.listen(PORT, () => {
    console.log("server running on port => ", PORT);
  });
};
