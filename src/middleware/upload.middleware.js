import multer from "multer";
import fs from "fs/promises";
import { resolve } from "path";
export const upload = ({ dest = "general", name } = {}) => {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const folderPath = resolve(`./uploads/${dest}/${name}`);
      try {
        const isFolderExist = await fs.access(folderPath, fs.constants.F_OK);
        console.log(isFolderExist);
      } catch (error) {
        await fs.mkdir(folderPath);
      }

      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  return multer({ storage });
};
