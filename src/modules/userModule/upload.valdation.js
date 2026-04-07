import joi from "joi";

export const coverPictureSchema = {
  params: joi.object({
    userId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid user ID format",
      }),
  }),
};

export const profilePictureSchema = {
  params: joi.object({
    userId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid user ID format",
      }),
  }),
};

export const removeProfilePictureSchema = {
  params: joi.object({
    userId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
  query: joi.object({
    type: joi.string().valid("current", "gallery").default("current"),
  }),
};

export const visitProfileSchema = {
  params: joi.object({
    userId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

export const getVisitCountSchema = {
  params: joi.object({
    userId: joi
      .string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};