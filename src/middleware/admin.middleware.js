import { UserRole } from "../db/enums/user.enums.js";
import { errorRes } from "../utils/res.handle.js";


export const adminRoleMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return errorRes({
        res,
        message: "Authentication required",
        status: 401,
      });
    }

    if (req.user.role !== UserRole.admin) {
      return errorRes({
        res,
        message: `Admin access required. Current role: ${
          req.user.role === UserRole.user ? "user" : "unknown"
        }`,
        status: 403,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const isAdmin = (user) => {
  return user && user.role === UserRole.admin;
};