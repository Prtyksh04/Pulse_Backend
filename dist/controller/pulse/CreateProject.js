import createHttpError from "http-errors";
import { generateJwtToken, hashString } from "../../utility/AuthUtility.js";
import { PrismaClient } from "@prisma/client";
import { verifyJwtToken, verifyUser } from "../../utility/AuthUtility.js";
const prisma = new PrismaClient();
var SignupType;
(function (SignupType) {
    SignupType["EMAIL_PASSWORD"] = "EMAIL_PASSWORD";
    SignupType["EMAIL_USERNAME_PASSWORD"] = "EMAIL_USERNAME_PASSWORD";
    SignupType["GOOGLE_AUTH"] = "GOOGLE_AUTH";
    SignupType["GITHUB_AUTH"] = "GITHUB_AUTH";
})(SignupType || (SignupType = {}));
export const createApplication = async (req, res, next) => {
    const { applicationName, signupType } = req.body;
    const cookie = req.headers.cookie;
    if (!cookie) {
        throw createHttpError("Invalid request");
    }
    try {
        if (!applicationName || !signupType) {
            throw createHttpError(400, "Application name and RequestType is Required ");
        }
        const hashRequestType = await hashString(signupType);
        if (!hashRequestType) {
            throw createHttpError("please give the proper Request type");
        }
        const token = cookie
            ?.split(";")
            .map(cookie => cookie.trim()).find(cookie => cookie.startsWith("token"))
            ?.split('=')[1];
        if (!token) {
            throw createHttpError("Invalid Request");
        }
        const decoded = await verifyJwtToken(token);
        const apiKey = decoded.userId;
        const verifieduser = verifyUser(apiKey);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Credentials");
        }
        const Newproject = await prisma.project.create({
            data: {
                projectName: applicationName,
                userId: apiKey,
                signupType: signupType
            }
        });
        const project = await generateJwtToken(Newproject.projectName);
        res.status(200).json({
            message: "Project created Successfully ",
            project: {
                token: token,
                projectName: project
            }
        });
        res.json({ project: Newproject });
    }
    catch (error) {
        next(error);
    }
};
