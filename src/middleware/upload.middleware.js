import multer from "multer";
import fs from "fs/promises";
import { resolve } from "path";

export const upload = ({ dest = "general", name } = {}) => {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      // ✅ if name is not provided, just use dest folder directly
      const folderPath = resolve(`./uploads/${dest}/${name ?? ""}`).replace(/\\$/, "").replace(/\/$/, "");
      
      try {
        await fs.access(folderPath);
      } catch (error) {
        await fs.mkdir(folderPath, { recursive: true }); // ✅ recursive creates parent folders too
      }

      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  return multer({ storage });
};