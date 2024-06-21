import express from "express";
import * as createApplicationController from "../controller/pulse/CreateProject.js";
import { verifyAuthToken } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(verifyAuthToken);
router.post("/createApplication", createApplicationController.createApplication);
export default router;
