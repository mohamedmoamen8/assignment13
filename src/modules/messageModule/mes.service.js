import { errorRes } from "../../utils/res.handle.js";
import { create, findById, find } from "../../db/models/db.repo.js";
import { messageModel } from "../../db/models/message.model.js";
import { userModel } from "../../db/models/user.models.js";
import * as messageRepo from "./mes.repo.js";

export const sendMessage = async ({ to, body, attachments }) => {
  const user = await findById({ model: userModel, id: to });
  if (!user) {
    errorRes({
      message: "receiver user not found",
      status: 404,
    });
  }
  const message = await create({
    model: messageModel,
    data: {
      to: user._id,
      body,
      attachments,
    },
  });
  return {
    data: {
      message,
    },
  };
};
export const getUserMessages = async (userId) => {
  const messages = await messageModel.find({
    to: userId,
    deletedAt: null,
  }).populate("senderId", "username email");
  return { data: messages };
};
