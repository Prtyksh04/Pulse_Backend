import express from "express";

import * as PulseAuthController from "../controller/pulseAuth.js";
import { PulseAuthBody } from "../schema/userSchema.js";
import { validatedata } from "../middleware/validationMiddleware.js";
const router = express.Router();
router.post("/pulseAuthSignUp",validatedata(PulseAuthBody),PulseAuthController.PulseSignUp);
router.post("/pulseAuthSignIn",validatedata(PulseAuthBody),PulseAuthController.PulseSignIn);
export default router;


