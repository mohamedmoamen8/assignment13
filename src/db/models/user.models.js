import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

import { Gender,  providertypes} from "../enums/user.enums.js";
const userShecma = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        if (this.provider == providertypes.system) {
          return true;
        } 
        else {
          return false;
        }
      },
      minLength: 8,
    },
    gender: {
      type: Number,
      default: Gender.male,
      enum: Object.values(Gender),
    },
    isEmailconfirmed: {
      type: Boolean,
      default: false,
    },
    age: Number,

    isDeleted: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: Number,
      defult: providertypes.system,
      enum: Object.values(providertypes),
    },
  },

  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      getters: true,
    },
    toObject: {
      virtuals: true,
      getters: true,
    },
    strict: true,
    strictQuery: true,
    validateBeforeSave: true,
    optimisticConcurrency: true,
  },
);

userShecma
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.set("firstName", firstName);
    this.set("lastName", lastName);
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

export const userModel = models.User || model("User", userShecma);
