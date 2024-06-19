import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { PrismaClient } from "@prisma/client";
import { AuthBodyType } from "../schema/AuthSchema.js";
import { verifyJwtToken ,verifyUser} from "../utility/AuthUtility.js";
const prisma = new PrismaClient();


export const AuthSignUp : RequestHandler = async(req:Request<{},{},AuthBodyType> , res : Response , next : NextFunction)=>{
    try {
        const cookie = req.headers.cookie;
        if (!cookie) {
            throw createHttpError("Invalid request");
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

        const userProject = await prisma.project.findUnique({
            where:{
                userId:apiKey 
            }
        });
    } catch (error) {
        next(error);
    }
}
