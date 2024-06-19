import express from "express";
import * as AuthController from "../controller/auth.js";
const router = express.Router();
router.post("/signup", AuthController.SignUp);
export default router;
