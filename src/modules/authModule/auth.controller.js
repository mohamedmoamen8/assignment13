import { Router } from "express";
import { successRes } from "../../utils/res.handle.js";
import { userModel } from "../../db/models/user.models.js";
import {
  authentication,
  verifyTokenMiddleware,
} from "../../middleware/auth.middeleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import { getUserProfile, login, signup } from "./auth.service.js";
import dotenv from "dotenv";

dotenv.config({
  path: "./config/.env.development",
});

import * as authservice from "./auth.service.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { validation } from "../../middleware/valdation.middleware.js";
import { loginSchema, signupSchema } from "./auth.validation.js";
import { updatePasswordSchema } from "./auth.validation.js";
import { 
  enableTwoFactorSchema,
  loginConfirmSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";  

const router = Router();
router.post("/signup", validation(signupSchema),async (req, res, next) => {
  const { username, password, email, age, gender } = req.body;
  
  const { data } = await signup({ username, password, email, gender, age });

  return successRes({
    res,
    data,
    status: 201,
    message: "created",
  });
});
router.post("/login", validation(loginSchema),async (req, res, next) => {
  const { data } = await login(req.body);
  return successRes({
    res,
    data,
    status: 200,
    message: "login",
  });
});

router.get("/profile", authentication, async (req, res) => {
  const { data } = await authservice.getUserProfile({
    id: req.user._id,
  });

  return successRes({
    res,
    data,
  });
});
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res, next) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({
        username: name,
        email,
        googleId,
        password: null,
      });
    }

    const accessToken = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" },
    );

    return res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) throw new Error("User not found");

  if (user.emailOTP !== otp) throw new Error("Invalid OTP");
  if (Date.now() > user.emailOTPExpires) throw new Error("OTP expired");

  user.isEmailConfirmed = true;
  user.emailOTP = null;
  user.emailOTPExpires = null;
  await user.save();

  return res.json({ message: "Email confirmed" });
});
router.post(
  "/upload",
  verifyTokenMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    const userId = req.user._id;

    await userModel.findByIdAndUpdate(userId, {
      avatar: "/uploads/" + req.file.filename,
    });

    return res.json({
      message: "uploaded",
      file: req.file.filename,
    });
  },
);
router.post("/signup/gmail", async (req, res) => {
  const { idToken } = req.body;
   const { data } = await authservice.googlesignup({ gooleToken: idToken });
  return successRes({ res, data, message: "signup with google" });
});
router.patch("/update-password", authentication, validation(updatePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { data } = await authservice.updatePassword({
      userId: req.user._id,
      currentPassword,
      newPassword,
    });

    return successRes({ res, data, status: 200, message: "Password updated" });
  } catch (error) {
    next(error);
  }
});


router.post("/logout", authentication, async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const { data } = await authservice.logout({ token });

    return successRes({ res, data, status: 200, message: "Logged out" });
  } catch (error) {
    next(error);
  }
});

router.post("/enable-2fa", authentication, validation(enableTwoFactorSchema), async (req, res, next) => {
  try {
    const { data } = await authservice.enableTwoFactor({
      userId: req.user._id,
    });

    return successRes({ res, data, status: 200, message: "2FA enabled" });
  } catch (error) {
    next(error);
  }
});
router.post ("/verify-2fa", authentication, validation(loginConfirmSchema), async (req, res, next) => {
  try {
    const { otp } = req.body;

    const { data } = await authservice.verifyTwoFactor({
      userId: req.user._id,
      otp,
    });

    return successRes({ res, data, status: 200, message: "2FA verified" });
  } catch (error) {
    next(error);
  }
});
router.post("/login-confirm", validation(loginConfirmSchema), async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const { data } = await authservice.loginConfirm({ email, otp });

    return successRes({ res, data, status: 200, message: "Login confirmed" });
  } catch (error) {
    next(error);
  }
});

router.post("/forget-password", validation(forgetPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;

    const { data } = await authservice.forgetPassword({ email });

    return successRes({ res, data, status: 200, message: "Password reset email sent" });
  } catch (error) {
    next(error);
  }
});

router.patch("/reset-password", validation(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const { data } = await authservice.resetPassword({ token, newPassword });

    return successRes({ res, data, status: 200, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
}); 
export default router;
