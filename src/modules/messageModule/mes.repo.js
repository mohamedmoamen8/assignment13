import { messageModel  } from "../../db/models/message.model.js";

export const createMessage = (data) => {
  return messageModel.create(data);
};

export const findUserMessages = (userId) => {
  return messageModel.find({
    to: userId,
    deletedAt: null,
  }).populate("senderId", "username email"); 
};
