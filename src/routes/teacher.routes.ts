import { Router } from "express";
import * as teacher from "../controllers/teacher.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { uploadPdf, uploadVideo } from "../middleware/upload.middleware.js";
import {
  createElearningSchema,
  createHomeworkSchema,
  createNotificationSchema,
  createReportCardSchema,
  markAttendanceSchema,
  updateAttendanceSchema,
  updateHomeworkSchema,
  updateReportCardSchema,
} from "../validators/teacher.schema.js";

const router = Router();

router.use(authenticate, authorize("TEACHER"));

router.post("/attendance", validateBody(markAttendanceSchema), teacher.markAttendance);
router.get("/attendance/class/:classId/date/:date", teacher.getClassAttendance);
router.get("/attendance/student/:studentId", teacher.getStudentAttendance);
router.put("/attendance/:id", validateBody(updateAttendanceSchema), teacher.updateAttendance);

router.post("/homework", validateBody(createHomeworkSchema), teacher.createHomework);
router.get("/homework/class/:classId", teacher.getClassHomework);
router.get("/homework/assigned", teacher.getAssignedHomework);
router.put("/homework/:id", validateBody(updateHomeworkSchema), teacher.updateHomework);
router.delete("/homework/:id", teacher.deleteHomework);

router.post("/report-cards", uploadPdf, validateBody(createReportCardSchema), teacher.createReportCard);
router.get("/report-cards/student/:studentId", teacher.getStudentReportCards);
router.get("/report-cards/class/:classId/exam/:exam", teacher.getClassReportCards);
router.put("/report-cards/:id", validateBody(updateReportCardSchema), teacher.updateReportCard);

router.post("/notifications", validateBody(createNotificationSchema), teacher.publishNotification);
router.get("/notifications", teacher.listTeacherNotifications);

router.post("/e-learning", uploadVideo, validateBody(createElearningSchema), teacher.uploadElearning);
router.get("/e-learning/class/:classId", teacher.listElearning);
router.delete("/e-learning/:id", teacher.deleteElearning);

export default router;
