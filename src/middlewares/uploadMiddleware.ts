import multer from "multer";
import path from "path";

// Multer config
const storage = multer.diskStorage({});

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".pdf" && ext !== ".doc" && ext !== ".docx") {
    cb(new Error("Only PDF and Word documents are supported"), false);
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
