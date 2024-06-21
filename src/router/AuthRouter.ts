import express from "express";

import * as AuthController from "../controller/client/Auth.js";
const router = express.Router();
router.post("/Auth/SignUp",AuthController.AuthSignUp);
router.post("/Auth/SignIn",AuthController.AuthSignIn);
export default router;