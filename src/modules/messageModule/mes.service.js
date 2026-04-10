import { errorRes } from "../../utils/resHandler.js";
import { create, findById, find } from "../../db/models/db.repo.js";

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
  const messages = await messageRepo.find({
    model: messageModel,
    filter: { to: userId },
  });
  return { data: messages };
};
