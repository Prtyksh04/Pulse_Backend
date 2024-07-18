import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { hashString, generateApiKey, verifyPassword } from "../../utility/AuthUtility.js";
import { PrismaClient } from "@prisma/client";
import { generateJwtToken } from "../../utility/AuthUtility.js";
import { PulseAuthBodyType } from "../../schema/userSchema.js";
import { generateOTP, sendOTPByEmail } from "../../utility/AuthUtility.js";


const prisma = new PrismaClient();


export const PulseSignUp: RequestHandler = async (req: Request<{}, {}, PulseAuthBodyType>, res: Response, next: NextFunction) => {
    const { email, password  } = req.body;
    try {
        if (!email || !password) {
            throw createHttpError(400, "Email and Password are required");
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
            message: "OTP send to your Email",
            data: { email }
        });
        // const hashedPassword = await hashString(password);
        // const apiKey = await  generateApiKey({email , password});
        // const token = await generateJwtToken(apiKey);
        // const newUser = await prisma.pulseUser.create({
        //     data:{
        //         email,
        //         password:hashedPassword,
        //         apiKey,
        //         userApiKey:token,
        //     }
        // });

        // res.status(201).json({
        //     message:"User created Successfully",
        //     user:{
        //         newUser
        //     }
        // });
    } catch (error) {
        next(error)
    }
}
export const PulseverifyOTP: RequestHandler = async (req: Request<{}, {}, PulseAuthBodyType>, res: Response, next: NextFunction) => {
    const { email, password, otp } = req.body;

    try {
        if (!email || !password) {
            throw createHttpError(400, "Email and Password are required");
        }

        const otpRecord = await prisma.otp.findFirst({
            where: { email },
            select: { otp: true, expiresAt: true }
        });
        if (!otpRecord || otpRecord.otp != otp || otpRecord.expiresAt < new Date()) {
            res.status(400).json({ message: "Invalid or expired OTP" });
        }

        await prisma.otp.delete({
            where: { email }
        });

        const hashedPassword = await hashString(password);
        const apiKey = await generateApiKey({ email, password });
        const token = await generateJwtToken(apiKey);
        const newUser = await prisma.pulseUser.create({
            data: {
                email,
                password: hashedPassword,
                apiKey,
                userApiKey: token,
            }
        });

        res.status(201).json({
            message: "User created Successfully",
            user: {
                newUser
            }
        });
    } catch (error) {
        next(error);
    }


}

export const PulseSignIn: RequestHandler = async (req: Request<{}, {}, PulseAuthBodyType>, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw createHttpError(400, "Email and Password are required");
        }

        const user = await prisma.pulseUser.findUnique({
            where: { email },
            select: {
                password: true,
                userApiKey: true,
                email: true,
                apiKey: true
            }
        });
        if (!user) {
            throw createHttpError(401, "Invalid Email or Password");
        }

        const verifiedPassword = await verifyPassword(password, user.password);

        if (!verifiedPassword) {
            throw createHttpError(401, "Invalid Email or Password");
        }
        const token = user.userApiKey;
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true
        });

        res.status(200).json({
            message: "Login Successfull",
            user: {
                apiKey: user.apiKey,
                email: user.email,
            }
        });
    } catch (error) {
        next(error)
    }
}

export const pulseLogout = (req: Request, res: Response, next: NextFunction) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict"
        });
        res.status(200).json({
            message: "Logout Successful"
        })

    } catch (error) {
        next(createHttpError(500, "Failed to log out"));
    }
}

