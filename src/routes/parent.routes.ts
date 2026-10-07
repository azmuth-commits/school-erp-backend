import { Router } from "express";
import * as parent from "../controllers/parent.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { payFeeSchema } from "../validators/parent.schema.js";

const router = Router();

router.use(authenticate, authorize("PARENT"));

router.get("/children", parent.listChildren);
router.get("/children/:id", parent.getChild);

router.get("/children/:childId/attendance", parent.getChildAttendance);
router.get("/children/:childId/attendance/stats", parent.getChildAttendanceStats);

router.get("/children/:childId/homework", parent.getChildHomework);
router.post("/children/:childId/homework/:homeworkId/submit", parent.submitHomework);

router.get("/children/:childId/report-cards", parent.getChildReportCards);
router.get("/children/:childId/report-cards/:id/download", parent.downloadReportCard);

router.get("/children/:childId/fees", parent.getChildFees);
router.post("/children/:childId/fees/:feeId/pay", validateBody(payFeeSchema), parent.payChildFee);

router.get("/children/:childId/marks", parent.getChildMarks);

router.get("/announcements", parent.getAnnouncements);
router.put("/announcements/:id/read", parent.markAnnouncementRead);

export default router;
