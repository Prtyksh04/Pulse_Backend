import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { projectBodytype } from "../schema/projectSchema.js";
import { hashString } from "../utility/AuthUtility.js";
import { PrismaClient, SignupType } from "@prisma/client";
import { verifyJwtToken , verifyUser} from "../utility/AuthUtility.js";
const prisma = new PrismaClient();

export const createApplication: RequestHandler = async (req: Request<{}, {}, projectBodytype>, res: Response, next: NextFunction) => {
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
        const decoded =await  verifyJwtToken(token) as {userId : string};
        const apiKey = decoded.userId;
        const verifieduser = verifyUser(apiKey);
        if(!verifieduser){
            throw createHttpError(401,"Invalid Credentials");
        }
        const Newproject = await prisma.project.create({
            data:{
                projectName:applicationName,
                userId:apiKey,
                signupType:signupType as SignupType
            }
        });
        res.json({project : Newproject});
    } catch (error) {
        next(error);
    }
}