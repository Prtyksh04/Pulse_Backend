import express from "express";
import rateLimiter from "../middleware/rateLimiting.js";
import * as AuthController from "../controller/client/Auth.js";
const router = express.Router();
router.post("/Auth/SignUp", AuthController.AuthSignUp);
router.post("/Auth/SignIn", rateLimiter, AuthController.AuthSignIn);
router.post("/Auth/formtype", AuthController.formType);
router.post("Auth/logout", AuthController.AuthLogout);
export default router;
