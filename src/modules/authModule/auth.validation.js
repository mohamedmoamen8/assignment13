import joi from "joi";
import { Gender } from "../../db/enums/user.enums.js";
export const signupSchema = joi.object({
  username: joi.string().min(3).max(30).custom((value, helpers) => {
    const {firstName, lastName} = value.split(" ");
    if (!firstName || !lastName) {
      return helpers.message("Username must contain both first name and last name");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return helpers.message("Username must contain only letters, numbers, and underscores");
    }
    return value;
  }).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).max(100).regex(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$") ).required(),
  repeat_password: joi.string().valid(joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),
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
export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).disallow(Joi.ref("currentPassword")).required()
    .messages({ "any.invalid": "New password must be different from current password" }),
});