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
if (foundUser.isTwoFactorEnabled) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    foundUser.twoFactorOTP = otp;
    foundUser.twoFactorOTPExpires = Date.now() + 5 * 60 * 1000;
    await foundUser.save();   
    await sendOTPEmail(foundUser.email, otp);
    return {
      data: {
        message: "2-Step verification OTP sent to email",
        userId: foundUser._id,
      },
    };
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

export const enableTwoFactor =async ({ userId }) => {
  const user = await userModel.findById(userId);

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.twoFactorOTP = otp;
  user.twoFactorOTPExpires = Date.now() + 5 * 60 * 1000;
  await user.save();
  await sendOTPEmail(user.email, otp);

  return { data: { message: "Two-factor OTP sent to email" } };
}
export const verifyTwoFactor = async ({ userId, otp }) => {
  const user = await userModel.findById(userId);

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }

  if (user.twoFactorOTP !== otp || user.twoFactorOTPExpires < Date.now()) {
    errorRes({ message: "Invalid or expired OTP", status: 400 });
  }

  user.isTwoFactorEnabled = true;
  user.twoFactorOTP = null;
  user.twoFactorOTPExpires = null;
  await user.save();

  return { data: { message: "2-Step verification enabled successfully" } };
} 
export const loginConfirm = async ({ email, otp }) => {
  const user = await userModel
    .findOne({ email })
    .select("twoFactorOtp twoFactorOtpExpires isTwoFactorEnabled");

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }

  if (!user.isTwoFactorEnabled) {
    errorRes({ message: "2-Step verification is not enabled", status: 400 });
  }

  if (user.twoFactorOtp !== otp) {
    errorRes({ message: "Invalid OTP", status: 400 });
  }

  if (Date.now() > user.twoFactorOtpExpires) {
    errorRes({ message: "OTP expired", status: 400 });
  }

  user.twoFactorOtp = null;
  user.twoFactorOtpExpires = null;
  await user.save();

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

  return { data: { accessToken, refreshToken } };
};


export const forgetPassword = async ({ email }) => {
  const user = await userModel.findOne({ email }).select("email provider");

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }

  if (user.provider !== providertypes.system) {
    errorRes({ message: "Google accounts cannot reset password", status: 400 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
  await user.save();

  await sendOTPEmail(email, otp);

  return { data: { message: "Password reset OTP sent to your email" } };
};


export const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await userModel
    .findOne({ email })
    .select("resetPasswordOtp resetPasswordOtpExpires password provider");

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }

  if (user.resetPasswordOtp !== otp) {
    errorRes({ message: "Invalid OTP", status: 400 });
  }

  if (Date.now() > user.resetPasswordOtpExpires) {
    errorRes({ message: "OTP expired", status: 400 });
  }

  user.password = await generateHash({ plaintext: newPassword, target: "argon" });
  user.resetPasswordOtp = null;
  user.resetPasswordOtpExpires = null;
  await user.save();

  return { data: { message: "Password reset successfully" } };
};