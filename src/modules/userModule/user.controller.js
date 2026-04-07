import { Router } from "express";
import { successRes, errorRes } from "../../utils/res.handle.js";
import { upload } from "../../middleware/upload.middleware.js";
import { verifyTokenMiddleware } from "../../middleware/auth.middeleware.js";
import { validation } from "../../middleware/valdation.middleware.js";
import * as userService from "./user.service.js";
import { UserRole } from "../../db/enums/user.enums.js";
import {
  coverPictureSchema,
  profilePictureSchema,
  removeProfilePictureSchema,
  visitProfileSchema,
  getVisitCountSchema,
} from "./upload.valdation.js";

const router = Router();


const isAdminMiddleware = async (req, res, next) => {
  try {
    if (req.user.role !== UserRole.admin) {
      return errorRes({
        res,
        message: "Admin access required",
        status: 403,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

router.get('/image',upload({}).single('image'),(req,res)=>{
  if(!req.file){
    return errorRes({ res, message: "No file uploaded", status: 400 });
  } 
  else{
    return successRes({ res, message: "File uploaded", data: { path: req.file.path } });
  } 
});

router.post(
  "/cover/:userId",
  verifyTokenMiddleware,
  validation(coverPictureSchema),
  upload().single("coverPicture"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      
      if (req.user._id.toString() !== userId) {
        return errorRes({
          res,
          message: "Unauthorized - cannot upload cover for other users",
          status: 403,
        });
      }

      if (!req.file) {
        return errorRes({
          res,
          message: "No file uploaded",
          status: 400,
        });
      }

      const { data } = await userService.uploadCoverPicture(
        userId,
        req.file.path
      );

      return successRes({
        res,
        status: 201,
        message: "Cover picture uploaded",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);


router.post(
  "/profile/:userId",
  verifyTokenMiddleware,
  validation(profilePictureSchema),
  upload({dest:"users"}).single("profilePicture"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      
      if (req.user._id.toString() !== userId) {
        return errorRes({
          res,
          message: "Unauthorized - cannot upload profile picture for other users",
          status: 403,
        });
      }

      if (!req.file) {
        return errorRes({
          res,
          message: "No file uploaded",
          status: 400,
        });
      }

      const { data } = await userService.uploadProfilePicture(
        userId,
        req.file.path
      );

      return successRes({
        res,
        status: 201,
        message: "Profile picture updated",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);


router.delete(
  "/cover/:userId/:imageIndex",
  verifyTokenMiddleware,
  validation(coverPictureSchema),
  async (req, res, next) => {
    try {
      const { userId, imageIndex } = req.params;

      
      if (req.user._id.toString() !== userId) {
        return errorRes({
          res,
          message: "Unauthorized - cannot delete cover for other users",
          status: 403,
        });
      }

      const { data } = await userService.removeCoverPicture(
        userId,
        parseInt(imageIndex)
      );

      return successRes({
        res,
        message: "Cover picture removed",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);


router.delete(
  "/profile/:userId",
  verifyTokenMiddleware,
  validation(removeProfilePictureSchema),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { type = "current" } = req.query;

      
      if (req.user._id.toString() !== userId) {
        return errorRes({
          res,
          message: "Unauthorized - cannot delete profile picture for other users",
          status: 403,
        });
      }

      const { data } = await userService.removeProfilePicture(
        userId,
        type
      );

      return successRes({
        res,
        message: "Profile picture deleted",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);


router.get(
  "/visit/:userId",
  verifyTokenMiddleware,
  validation(visitProfileSchema),
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      const { data } = await userService.getUserProfileWithVisit(
        userId,
        req.user._id
      );

      return successRes({
        res,
        message: "Profile fetched",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);


router.get(
  "/visit-count/:userId",
  verifyTokenMiddleware,
  validation(getVisitCountSchema),
  isAdminMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      const { data } = await userService.getProfileVisitCount(
        userId,
        req.user._id
      );

      return successRes({
        res,
        message: "Visit count retrieved",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);


router.get(
  "/visit-count-all",
  verifyTokenMiddleware,
  isAdminMiddleware,
  async (req, res, next) => {
    try {
      const { data } = await userService.getAllUsersVisitCounts(
        req.user._id
      );

      return successRes({
        res,
        message: "All visit counts retrieved",
        data,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;