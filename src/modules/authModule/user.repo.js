import { userModel } from "../../db/models/user.models.js";

export const createUser = (data) => {
  return userModel.create(data);
};


export const findByEmail = (email) => {
  return userModel.findOne({ email });
};


export const findOne = (filter) => {
  return userModel.findOne(filter);
};