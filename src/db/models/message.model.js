import mongoose from "mongoose";
import { Types } from "mysql2";

const { model, models, Schema } = mongoose;
const schema = new Schema(
  {
    body:{
      type: String,
      required: function () {
        if(this.attachments.length === 0){
          return true;
        } else {    return false;
        }
      }
    }, attachments: [{
      type: String,
      default: [],
    }],
    to: {
      type:Types.ObjectId,
      ref: "User",
      required: true,   
  }  },
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

export const messageModel =model("Message",schema);
