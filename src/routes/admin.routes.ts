import { Router } from "express";
import * as admin from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateBody, validateQuery } from "../middleware/validation.middleware.js";
import {
  announcementSchema,
  assignClassSchema,
  assignTeacherSchema,
  createClassSchema,
  createFeeSchema,
  createStudentSchema,
  createTeacherSchema,
  createTimetableSchema,
  updateFeeSchema,
  updateStudentSchema,
  updateTeacherSchema,
  updateTimetableSchema,
} from "../validators/admin.schema.js";
import { paginationQuery } from "../validators/common.schema.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.post("/students", validateBody(createStudentSchema), admin.createStudent);
router.get("/students", validateQuery(paginationQuery), admin.listStudents);
router.get("/students/:id", admin.getStudent);
router.put("/students/:id", validateBody(updateStudentSchema), admin.updateStudent);
router.delete("/students/:id", admin.deleteStudent);

router.post("/classes", validateBody(createClassSchema), admin.createClass);
router.get("/classes", admin.listClasses);
router.put("/classes/:id/assign-teacher", validateBody(assignTeacherSchema), admin.assignClassTeacher);
router.delete("/classes/:id", admin.deleteClass);

router.post("/teachers", validateBody(createTeacherSchema), admin.createTeacher);
router.get("/teachers", admin.listTeachers);
router.put("/teachers/:id", validateBody(updateTeacherSchema), admin.updateTeacher);
router.post("/teachers/:id/assign-class", validateBody(assignClassSchema), admin.assignTeacherClass);
router.delete("/teachers/:id/classes/:classId", admin.removeTeacherClass);

router.post("/timetable", validateBody(createTimetableSchema), admin.createTimetable);
router.get("/timetable/class/:classId", admin.getClassTimetable);
router.put("/timetable/:id", validateBody(updateTimetableSchema), admin.updateTimetable);
router.delete("/timetable/:id", admin.deleteTimetable);

router.post("/fees", validateBody(createFeeSchema), admin.createFee);
router.get("/fees/student/:studentId", admin.getStudentFees);
router.put("/fees/:id", validateBody(updateFeeSchema), admin.updateFee);
router.delete("/fees/:id", admin.deleteFee);

router.post("/announcements", validateBody(announcementSchema), admin.createAnnouncement);
router.get("/announcements", admin.listAnnouncements);
router.put("/announcements/:id", validateBody(announcementSchema.partial()), admin.updateAnnouncement);
router.delete("/announcements/:id", admin.deleteAnnouncement);

export default router;
