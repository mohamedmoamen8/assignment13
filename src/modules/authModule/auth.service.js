import { userModel } from "../../db/models/user.models.js";
import { errorRes } from "../../utils/res.handle.js";
import { generateHash } from "../../secuirty/hashsecuirty.js";
import { findById } from "../../db/models/db.repo.js";
import { findByEmail, createUser } from "./user.repo.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import { sendOTPEmail } from "../../utils/email.js";
import { providertypes } from "../../db/enums/user.enums.js";
import redisClient from "../../utils/redisClient.js";


dotenv.config({
  path: "./config/.env.development",
});
const client = new OAuth2Client();
export const signup = async ({ username, password, email, gender, age }) => {
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    errorRes({
      message: "email already exist",
      status: 400,
    });
  }
  let plaintext;
  if (password) {
    plaintext = await generateHash({ plaintext: password, target: "argon" });
  }
  const user = await userModel.create({
    username,
    password: plaintext,
    email,
    age,
    gender,
    provider: providertypes.system,
  });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailOtp = otp;
  user.emailOTPExpires = Date.now() + 5 * 60 * 1000;
  await user.save();
  await sendOTPEmail(email, otp);

  return {
    data: user,
  };
};

export const login = async ({ email, password }) => {
  const foundUser = await findByEmail({ email ,selsect:"password provider firstName lastName email"});

  if (!foundUser) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, foundUser.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  if (isEmailExist.provider == providertypes.google) {
    errorRes({
      message: "use google login",
      status: 400,
    });
  }
  const accessToken = jwt.sign(
    { _id: foundUser._id },
    process.env.TOKEN_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { _id: foundUser._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" },
  );

  return {
    data: {
      accessToken,
      refreshToken,
    },
  };
};

export const getUserProfile = async ({ id }) => {
  const user = await findById({
    model: userModel,
    id,
  });
  return {
    data: user,
  };
};

export const googlesignup = async ({ gooleToken }) => {
  const ticket = await client.verifyIdToken({
    idToken: gooleToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { name, email,email_verified } = ticket.getPayload();

  let user = await findByEmail(email);

  if (user) {
    if (user.provider === providertypes.system) {
      errorRes({
        message: "use system login",
        status: 400,
      });
    }
  } else {
    user = await createUser({
      model: userModel,
      data: {
      username: name,
      email,
      provider: providertypes.google,
      isConfirmed: true,
      isEmailconfirmed: email_verified,}
    });
  }

  const accessToken = jwt.sign(
    { _id: user._id },
    process.env.TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  return {
    data: {
      accessToken,
      refreshToken,
    },
  };
};
export const updatePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await userModel.findById(userId).select("password provider");

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }

  if (user.provider !== providertypes.system) {
    errorRes({ message: "Google accounts cannot update password", status: 400 });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    errorRes({ message: "Current password is incorrect", status: 400 });
  }

  const hashed = await generateHash({ plaintext: newPassword, target: "argon" });

  user.password = hashed;
  await user.save();

  return { data: { message: "Password updated successfully" } };
};

export const logout = async ({ token }) => {
  const decoded = jwt.decode(token);

  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  if (ttl > 0) {
    await redisClient.setEx(`blacklist_${token}`, ttl, "true");
  }

  return { data: { message: "Logged out successfully" } };
};