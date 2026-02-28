import joi from "joi";
import { Gender } from "../../db/enums/user.enums.js";
export const signupSchema = joi.object({
  username: joi.string().min(3).max(30).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).max(100).required(),
  gender: joi
    .number()
    .valid(...Object.values(Gender))
    .required(),
  age: joi.number().min(0).max(120).optional(),
});

export const loginSchema = {
  body: joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).max(100).required(),
  }),
};
