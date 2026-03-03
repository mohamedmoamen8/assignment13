import multer from "multer";
import fs from "fs";
import { resolve } from "path";
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folderPath = resolve("./uploads");
    try {
      
     const isFolderExist = await fs.access(folderPath,fs.constants.F_OK);
     console.log(isFolderExist);
    } catch (error) {
      await fs.mkdir(folderPath);
    }
    
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

export const upload = multer({ storage });