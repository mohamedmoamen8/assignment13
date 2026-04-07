import fs from "fs/promises";
import path from "path";
import { userModel } from "../../db/models/user.models.js";
import { UserRole } from "../../db/enums/user.enums.js";
import { errorRes } from "../../utils/res.handle.js"
export const uploadCoverPicture = async (userId, filePath) => {
  try {
    const user = await userModel.findById(userId);
    
    if (!user) {
      errorRes({
        message: "User not found",
        status: 404,
      });
    }

    
    if (user.coverPictures.length >= 2) {
      
      await fs.unlink(filePath).catch(() => {});
      errorRes({
        message: "Maximum 2 cover images allowed. Delete one first.",
        status: 400,
      });
    }


    const normalizedPath = `/uploads/${path.basename(filePath)}`;
    user.coverPictures.push(normalizedPath);
    await user.save();

    return {
      data: {
        message: "Cover picture uploaded successfully",
        coverPictures: user.coverPictures,
        totalCount: user.coverPictures.length,
      },
    };
  } catch (err) {
    throw err;
  }
};


export const removeCoverPicture = async (userId, imageIndex) => {
  try {
    const user = await userModel.findById(userId);
    
    if (!user) {
      errorRes({
        message: "User not found",
        status: 404,
      });
    }

    if (imageIndex < 0 || imageIndex >= user.coverPictures.length) {
      errorRes({
        message: "Invalid image index",
        status: 400,
      });
    }

    const imagePath = user.coverPictures[imageIndex];
    const filePath = path.join(".", imagePath);

    
    await fs.unlink(filePath).catch(() => {});

  
    user.coverPictures.splice(imageIndex, 1);
    await user.save();

    return {
      data: {
        message: "Cover picture removed successfully",
        coverPictures: user.coverPictures,
        totalCount: user.coverPictures.length,
      },
    };
  } catch (err) {
    throw err;
  }
};


export const uploadProfilePicture = async (userId, filePath) => {
  try {
    const user = await userModel.findById(userId);
    
    if (!user) {
      errorRes({
        message: "User not found",
        status: 404,
      });
    }

    const normalizedPath = `/uploads/${path.basename(filePath)}`;

   
    if (user.profilePicture) {
      user.pictureGallery.push(user.profilePicture);
    }

    
    user.profilePicture = normalizedPath;
    await user.save();

    return {
      data: {
        message: "Profile picture updated successfully",
        profilePicture: user.profilePicture,
        galleryCount: user.pictureGallery.length,
      },
    };
  } catch (err) {
    throw err;
  }
};


export const removeProfilePicture = async (userId, imageType = "current") => {
  try {
    const user = await userModel.findById(userId);
    
    if (!user) {
      errorRes({
        message: "User not found",
        status: 404,
      });
    }

    if (imageType === "current") {
      if (!user.profilePicture) {
        errorRes({
          message: "No profile picture to delete",
          status: 400,
        });
      }

      const filePath = path.join(".", user.profilePicture);
      await fs.unlink(filePath).catch(() => {});

      user.profilePicture = null;
      await user.save();

      return {
        data: {
          message: "Profile picture deleted successfully",
          profilePicture: null,
        },
      };
    } else if (imageType === "gallery") {
    
      for (const imagePath of user.pictureGallery) {
        const filePath = path.join(".", imagePath);
        await fs.unlink(filePath).catch(() => {});
      }

      user.pictureGallery = [];
      await user.save();

      return {
        data: {
          message: "Gallery cleared successfully",
          galleryCount: 0,
        },
      };
    }
  } catch (err) {
    throw err;
  }
};


export const getUserProfileWithVisit = async (userId, visitedByUserId) => {
  try {
    const user = await userModel.findById(userId);
    
    if (!user) {
      errorRes({
        message: "User not found",
        status: 404,
      });
    }

   
    if (userId.toString() !== visitedByUserId.toString()) {
      user.profileVisitCount += 1;
      await user.save();
    }

    return {
      data: {
        user,
        visitCount: user.profileVisitCount,
      },
    };
  } catch (err) {
    throw err;
  }
};


 
export const getProfileVisitCount = async (userId, requesterId) => {
  try {
    const requester = await userModel.findById(requesterId);
    
  
    if (!requester || requester.role !== UserRole.admin) {
      errorRes({
        message: "Admin access required",
        status: 403,
      });
    }

    const user = await userModel.findById(userId).select("firstName lastName profileVisitCount role");
    
    if (!user) {
      errorRes({
        message: "User not found",
        status: 404,
      });
    }

    return {
      data: {
        userId: user._id,
        username: `${user.firstName} ${user.lastName}`,
        profileVisitCount: user.profileVisitCount,
        userRole: user.role === UserRole.admin ? "admin" : "user",
      },
    };
  } catch (err) {
    throw err;
  }
};


export const getAllUsersVisitCounts = async (requesterId) => {
  try {
    const requester = await userModel.findById(requesterId);
    
    if (!requester || requester.role !== UserRole.admin) {
      errorRes({
        message: "Admin access required",
        status: 403,
      });
    }

    const users = await userModel
      .find({ isDeleted: false })
      .select("firstName lastName email profileVisitCount role")
      .sort({ profileVisitCount: -1 });

    const usersData = users.map((user) => ({
      userId: user._id,
      username: `${user.firstName} ${user.lastName}`,
      email: user.email,
      profileVisitCount: user.profileVisitCount,
      role: user.role === UserRole.admin ? "admin" : "user",
    }));

    return {
      data: {
        totalUsers: usersData.length,
        users: usersData,
      },
    };
  } catch (err) {
    throw err;
  }
};


export const isAdminUser = (user) => {
  return user && user.role === UserRole.admin;
};