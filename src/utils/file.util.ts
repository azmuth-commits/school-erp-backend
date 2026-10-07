const PDF_MIME = new Set(["application/pdf"]);
const VIDEO_MIME = new Set(["video/mp4", "video/x-msvideo", "video/quicktime", "video/avi"]);

const REPORT_CARD_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 500 * 1024 * 1024;

export function assertReportCardFile(file?: Express.Multer.File) {
  if (!file) {
    throw new Error("PDF file is required");
  }
  if (!PDF_MIME.has(file.mimetype)) {
    throw new Error("Report cards must be PDF files");
  }
  if (file.size > REPORT_CARD_MAX) {
    throw new Error("Report card PDF exceeds 10MB");
  }
}

export function assertElearningVideo(file?: Express.Multer.File) {
  if (!file) {
    throw new Error("Video file is required");
  }
  if (!VIDEO_MIME.has(file.mimetype)) {
    throw new Error("E-learning videos must be MP4, AVI, or MOV");
  }
  if (file.size > VIDEO_MAX) {
    throw new Error("E-learning video exceeds 500MB");
  }
}

export function extensionForMime(mimetype: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
    "video/avi": "avi",
  };
  return map[mimetype] ?? "bin";
}
