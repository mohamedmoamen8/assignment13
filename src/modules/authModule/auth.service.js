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
import redisClient from "../../utils/redisclient.js";
import crypto from "crypto";


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
  { _id: foundUser._id, tokenVersion: foundUser.tokenVersion },
  process.env.TOKEN_SECRET,
  { expiresIn: "15m" }
);

const refreshToken = jwt.sign(
  { _id: foundUser._id, tokenVersion: foundUser.tokenVersion },
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
  { _id: foundUser._id, tokenVersion: foundUser.tokenVersion },
  process.env.TOKEN_SECRET,
  { expiresIn: "15m" }
);

const refreshToken = jwt.sign(
  { _id: foundUser._id, tokenVersion: foundUser.tokenVersion },
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

  const ttl = Math.ceil(decoded.exp - Date.now() / 1000); // ✅ Math.ceil → always a whole integer

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
  { _id: foundUser._id, tokenVersion: foundUser.tokenVersion },
  process.env.TOKEN_SECRET,
  { expiresIn: "15m" }
);

const refreshToken = jwt.sign(
  { _id: foundUser._id, tokenVersion: foundUser.tokenVersion },
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

  
  const resetToken = crypto.randomBytes(32).toString("hex");

  
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordTokenExpires = Date.now() + 15 * 60 * 1000; 
  await user.save();

  
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

  await sendResetPasswordEmail(user.email, resetLink);

  return { data: { message: "Password reset link sent to your email" } };
};


export const resetPassword = async ({ email, token, newPassword }) => {
 
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await userModel
    .findOne({ email })
    .select("resetPasswordToken resetPasswordTokenExpires password tokenVersion");

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }

  if (user.resetPasswordToken !== hashedToken) {
    errorRes({ message: "Invalid reset link", status: 400 });
  }

  if (Date.now() > user.resetPasswordTokenExpires) {
    errorRes({ message: "Reset link has expired", status: 400 });
  }

 
  user.password = await generateHash({ plaintext: newPassword, target: "argon" });
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpires = null;
  user.tokenVersion += 1; 
  await user.save();

  return { data: { message: "Password reset successfully, please login again" } };
};

export const resendOtp = async ({ email }) => {
  const user = await userModel.findOne({ email }).select(
    "isEmailconfirmed lastOtpSentAt otpResendCount emailOtp emailOTPExpires"
  );

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }

  if (user.isEmailconfirmed) {
    errorRes({ message: "Email is already confirmed", status: 400 });
  }

  // Rate limit: only 1 resend allowed per minute
  if (user.lastOtpSentAt) {
    const secondsSinceLastOtp = (Date.now() - user.lastOtpSentAt) / 1000;
    if (secondsSinceLastOtp < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceLastOtp);
      errorRes({
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
        status: 429,
      });
    }
  }

  // Rate limit: max 5 resends total
  if (user.otpResendCount >= 5) {
    errorRes({
      message: "Maximum OTP resend limit reached, please contact support",
      status: 429,
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.emailOtp = otp;
  user.emailOTPExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
  user.lastOtpSentAt = new Date();
  user.otpResendCount += 1;
  await user.save();

  await sendOTPEmail(email, otp);

  return {
    data: {
      message: `OTP resent successfully (${user.otpResendCount}/5 attempts used)`,
    },
  };
};
export const logoutAllDevices = async ({ userId }) => {
  const user = await userModel.findById(userId).select("tokenVersion");

  if (!user) {
    errorRes({ message: "User not found", status: 404 });
  }

  user.tokenVersion += 1; 
  await user.save();

  return { data: { message: "Logged out from all devices successfully" } };
};