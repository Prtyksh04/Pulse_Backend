import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { PrismaClient } from "@prisma/client";
import { AuthBodyType } from "../../schema/AuthSchema.js";
import { generateOTP, hashString, verifyJwtToken, verifyPassword, verifyUser } from "../../utility/AuthUtility.js";
import { sendOTPByEmail } from "../../utility/AuthUtility.js";  
import redisClient from "../../redisClient.js";
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

const checkClientUserUsingEmail = async (data: any) => {
    return await prisma.clientUser.findUnique({
        where: {
            email: data.email
        }, select: {
            password: true,
            email: true,
        }
    });
}

const checkClientUserUsingEmailOrUsername = async (data: any) => {
    return await prisma.clientUser.findFirst({
        where: {
            OR: [
                { email: data.email },
                { username: data.email }
            ]
        }, select: {
            password: true,
            email: true,
            username: true
        }
    });
}

export const AuthSignUp: RequestHandler = async (req: Request<{}, {}, AuthBodyType>, res: Response, next: NextFunction) => {
    const { email, projectName, apiKey } = req.body;
    try {
        if (!projectName && !apiKey) {
            throw createHttpError(400, "Invalid Request");
        }
        if (!email) {
            throw createHttpError(400, "Email not valid");
        }

        const verifiedToken = await verifyJwtToken(apiKey);
        if (!verifiedToken) {
            throw createHttpError(400, "Token provided is not valid");
        }
        const verifieduser = await verifyUser(verifiedToken.userId);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Request");
        }
        const userId = verifieduser.apiKey;
        const project = await verifyJwtToken(projectName);
        if (!project) {
            throw createHttpError(400, "Cannot find the Signup type");
        }
        const projectIdentified = await prisma.project.findUnique({
            where: {
                projectName: project.userId as string,
                userId: userId
            },
            select: {
                signupType: true,
                id: true,
            }
        });
        if (!projectIdentified) {
            throw createHttpError(404, "Project Not found");
        }

        const otpRecord = await prisma.otp.findFirst({
            where: { email },
            select: { otp: true, expiresAt: true }
        });

        let otp: string;
        if (otpRecord && otpRecord.expiresAt > new Date()) {
            otp = otpRecord.otp; 
        } else {
            otp = generateOTP();
            await prisma.otp.upsert({
                where: { email },
                update: {
                    otp,
                    expiresAt: new Date(Date.now() + 10 * 60000) 
                },
                create: {
                    email,
                    otp,
                    expiresAt: new Date(Date.now() + 10 * 60000) 
                }
            });
        }
        
        await sendOTPByEmail(email, otp);
        res.status(200).json({
            message: "OTP sent to your Email",
            data: { email }
        });
    } catch (error) {
        next(error);
    }
}


export const verifyOTP : RequestHandler = async(req : Request<{} , {} , AuthBodyType> , res :Response , next : NextFunction)=>{
    const {email , password , username , projectName , otp , apiKey } = req.body;

    try {
        if (!projectName && !apiKey) {
            throw createHttpError("Invalid Request");
        }
        if(!email){
            throw createHttpError("Email not valid");
        }
        const verifiedToken = await verifyJwtToken(apiKey);
        if (!verifiedToken) {
            throw createHttpError("Token provied is not valid");
        }
        const verifieduser = await verifyUser(verifiedToken.userId);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Request");
        }
        const userId =  verifieduser.apiKey;
        const project = await verifyJwtToken(projectName);
        if (!project) {
            throw createHttpError("Cannot find the Signup type");
        }
        const projectIdentified = await prisma.project.findUnique({
            where: {
                projectName: project.userId as string,
                userId: userId
            },
            select: {
                signupType: true,
                id:true,
            }
        });
        if (!projectIdentified) {
            throw createHttpError(404, "project Not found");
        }

        const otpRecord = await prisma.otp.findUnique({
            where :{
                email
            }
        });

        if(!otpRecord || otpRecord.otp != otp || otpRecord.expiresAt < new Date() ){
            res.status(400).json({message:"Invalid Or expired OTP"});
        }

        await prisma.otp.delete({
            where:{email}
        });
        let clientUser;
        switch (projectIdentified.signupType) {
            case SignupType.EMAIL_PASSWORD:
                if (!email || !password) throwError(400, "Password & email are required for email-password signup");
                const hashedPassword = await hashString(password);
                clientUser = await createClientUser({
                    email,
                    password: hashedPassword,
                    project: { connect: { id: projectIdentified.id } }
                });
                break;

            case SignupType.EMAIL_USERNAME_PASSWORD:
                if (!email || !password || !username) throwError(400, "Email, username, and password are required for email-username-password signup");
                const hashedPasswordWithEmail = await hashString(password);
                clientUser = await createClientUser({
                    email,
                    password: hashedPasswordWithEmail,
                    username,
                    project: { connect: { id: projectIdentified.id } }
                });
                break;
            default:
                throwError(400, "Unsupported signup type");
        }

        res.status(200).json({
            message:"OTP Verified"
        });

    } catch (error) {
        next(error);
    }

}

export const AuthSignIn: RequestHandler = async (req: Request<{}, {}, AuthBodyType>, res: Response, next: NextFunction) => {
    const { password ,email, projectName, apiKey } = req.body;
    try {
        if (!projectName && !apiKey) {
            throw createHttpError("Invalid Request");
        }
        const verifiedToken = await verifyJwtToken(apiKey);
        if (!verifiedToken) {
            throw createHttpError("Token provied is not valid");
        }
        const verifieduser = await verifyUser(verifiedToken.userId);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Request");
        }
        const userId =  verifieduser.apiKey;
        const project = await verifyJwtToken(projectName);
        if (!project) {
            throw createHttpError("Cannot find the Signup type");
        }const projectIdentified = await prisma.project.findUnique({
            where: {
                projectName: project.userId as string,
                userId: userId
            },
            select: {
                signupType: true,
                id:true,
            }
        });
        if (!projectIdentified) {
            throw createHttpError(404, "project Not found");
        }
        let clientUser;
        switch (projectIdentified.signupType) {
            case SignupType.EMAIL_PASSWORD:
                if (!email || !password) throwError(400, "Password & email are required for email-password signup");

                clientUser = await checkClientUserUsingEmail({ email });
                if (!clientUser?.password) {
                    throw throwError(400, "Password is Required for authentication");
                }
                const verifiedPassword = await verifyPassword(password, clientUser.password);
                if (!verifiedPassword) {
                    res.status(401).json({message : "Invalid password or username"});
                }
                break;
            case SignupType.EMAIL_USERNAME_PASSWORD:
                if (!password || (!email )) throwError(400, "Email, username, and password are required for email-username-password signup");

                clientUser = await checkClientUserUsingEmailOrUsername({ email });
                if (!clientUser?.password) {
                    throw throwError(400, "Password is Required for authentication");
                }
                const isPasswordValid = await verifyPassword(password, clientUser.password);
                if (!isPasswordValid) {
                    throwError(400, "Invalid Request");
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

export const AuthLogout = (req: Request, res: Response, next: NextFunction) => {
    try {

    } catch (error) {
        next(error);
    }
}

interface formType {
    projectName: string,
    token: string
}

export const formType: RequestHandler = async (req: Request<{}, {}, formType>, res: Response, next: NextFunction) => {
    const { token, projectName } = req.body;
    try {

        const CachedFormType = await redisClient.get(`${token}:${projectName}`);
        if(CachedFormType){
            return res.status(200).json(CachedFormType);
        }
        const verifiedToken = await verifyJwtToken(token);
        if (!verifiedToken) {
            throw createHttpError("User Not identified");
        }

        const verifieduser = await verifyUser(verifiedToken.userId);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Request");
        }

        const userId = verifieduser.apiKey;
        const project = await verifyJwtToken(projectName);
        if (!project) {
            throw createHttpError("Cannot find the Signup type");
        } 
        const projectIdentified = await prisma.project.findUnique({
            where: {
                projectName: project.userId as string,
                userId: userId
            },
            select: {
                signupType: true,
            }
        });
        const formtype = projectIdentified?.signupType;
        if (!formtype) {
            throw createHttpError("Invalid Form type , Please try again");
        }

        await redisClient.set(`${token}:${projectName}`, formtype, "EX", 3600);
        res.status(200).json(formtype);
    } catch (error) {
        next(error);
    }
}