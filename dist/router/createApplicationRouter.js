import express from "express";
import * as createApplicationController from "../controller/CreateProject.js";
const router = express.Router();
router.post("/createApplication", createApplicationController.createApplication);
export default router;
