import express from "express";
import subjectMasterRouter from "./subject/subjectMaster.routes.js";
import classSubjectRouter from "./subject/classSubject.routes.js";

const router = express.Router();

router.use("/subject-master", subjectMasterRouter);
router.use("/class-subject", classSubjectRouter);

export default router;
