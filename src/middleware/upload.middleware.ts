import multer from "multer";

const storage = multer.memoryStorage();

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
}).single("file");
