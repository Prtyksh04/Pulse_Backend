import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { PrismaClient } from "@prisma/client";
import { AuthBodyType } from "../schema/AuthSchema.js";
import { hashString,verifyPassword,verifyUser } from "../utility/AuthUtility.js";

const prisma = new PrismaClient();


enum SignupType {
    EMAIL_PASSWORD = "EMAIL_PASSWORD",
    EMAIL_USERNAME_PASSWORD = "EMAIL_USERNAME_PASSWORD",
    GOOGLE_AUTH = "GOOGLE_AUTH",
    GITHUB_AUTH = "GITHUB_AUTH",
}

const throwError = (status: number, message: string) => {
    throw createHttpError(status, message);
};

const createClientUser = async (data: any) => {
    return await prisma.clientUser.create({ data });
};

const checkClientUserUsingEmail = async(data : any)=>{
    return await prisma.clientUser.findUnique({
        where:{
            email:data.email
        },select:{
            password:true,
            email:true,
        }
    });
}

const checkClientUserUsingEmailOrUsername = async(data : any)=>{
    return await prisma.clientUser.findFirst({
        where :{
            OR:[
                {email:data.email},
                {username:data.username}
            ]
        },select:{
            password:true,
            email:true,
            username:true
        }
    });
}

export const AuthSignUp: RequestHandler = async (req: Request<{}, {}, AuthBodyType>, res: Response, next: NextFunction) => {
    const { email, password, username, Google, Github, projectName, apiKey } = req.body;
    try {
        if (!projectName && !apiKey) {
            throw createHttpError("Invalid Request");
        }
        const verifieduser = verifyUser(apiKey);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Request");
        }
        const userProject = await prisma.project.findUnique({
            where: {
                projectName: projectName,
            }, select: {
                signupType: true,
                userId: true,
                id: true,
            }
        });
        if (!userProject) {
            throw createHttpError(404, "project Not found");
        }
        let clientUser;
        switch (userProject.signupType) {
            case SignupType.EMAIL_PASSWORD:
                if (!email || !password) throwError(400, "Password & email are required for email-password signup");
                const hashedPassword = await hashString(password);
                clientUser = await createClientUser({
                    email,
                    password: hashedPassword,
                    project: { connect: { id: userProject.id } }
                });
                break;

            case SignupType.EMAIL_USERNAME_PASSWORD:
                if (!email || !password || !username) throwError(400, "Email, username, and password are required for email-username-password signup");
                const hashedPasswordWithEmail = await hashString(password);
                clientUser = await createClientUser({
                    email,
                    password: hashedPasswordWithEmail,
                    username,
                    project: { connect: { id: userProject.id } }
                });
                break;
            default:
                throwError(400, "Unsupported signup type");
        }
        res.status(200).json({
            message: "User Created Successfully",
            data: { user: clientUser }
        });
    } catch (error) {
        next(error);
    }
}



export const AuthSignIn: RequestHandler = async (req: Request<{}, {}, AuthBodyType>, res: Response, next: NextFunction) => {
    const { email, password, username, Google, Github, projectName, apiKey } = req.body;
    try {
        if (!projectName && !apiKey) {
            throw createHttpError("Invalid Request");
        }
        const verifieduser = verifyUser(apiKey);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Request");
        }
        const userProject = await prisma.project.findUnique({
            where: {
                projectName: projectName,
            }, select: {
                signupType: true,
                userId: true,
                id: true,
            }
        });
        if (!userProject) {
            throw createHttpError(404, "project Not found");
        }
        let clientUser;
        switch (userProject.signupType) {
            case SignupType.EMAIL_PASSWORD:
                if (!email || !password) throwError(400, "Password & email are required for email-password signup");

                clientUser = await checkClientUserUsingEmail({email});
                if(!clientUser?.password){
                    throw throwError(400,"Password is Required for authentication");
                }
                const verifiedPassword = verifyPassword(password,clientUser.password);
                if(!verifiedPassword){
                    throwError(400 , "Invalid Request");
                }
                break;

            case SignupType.EMAIL_USERNAME_PASSWORD:
                if (!password || (!email && !username)) throwError(400, "Email, username, and password are required for email-username-password signup");
                
                clientUser = await checkClientUserUsingEmailOrUsername({email,username});
                if(!clientUser?.password){
                    throw throwError(400,"Password is Required for authentication");
                }
                const isPasswordValid = verifyPassword(password,clientUser.password);
                if(!isPasswordValid){
                    throwError(400 , "Invalid Request");
                }
                break;
            default:
                throwError(400, "Unsupported signup type");
        }
        res.status(200).json({
            message: "User Identified Successfully",
            data: { user: clientUser }
        });
    } catch (error) {
        next(error);
    }
}
