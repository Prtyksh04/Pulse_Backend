import createHttpError from "http-errors";
import { hashString } from "../utility/AuthUtility.js";
import { PrismaClient } from "@prisma/client";
import { verifyJwtToken } from "../utility/AuthUtility.js";
const prisma = new PrismaClient();
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
        const updateRequestype = await prisma.pulseUser.update({
            where: {
                apiKey: apiKey
            },
            data: {
                signupType: signupType
            },
            select: {
                signupType: true,
            }
        });
        const Newproject = await prisma.project.create({
            data: {
                projectName: applicationName,
                userId: apiKey
            }
        });
        res.json({ update: updateRequestype, project: Newproject });
    }
    catch (error) {
        next(error);
    }
};
