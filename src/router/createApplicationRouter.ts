import express from "express";

import * as createApplicationController from "../controller/CreateProject.js";
import { validatedata } from "../middleware/validationMiddleware.js";
const router = express.Router();
router.post("/createApplication",createApplicationController.createApplication);
export default router;