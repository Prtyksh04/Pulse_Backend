import createHttpError from "http-errors";
import { hashString, generateApiKey, verifyPassword } from "../../utility/AuthUtility.js";
import { PrismaClient } from "@prisma/client";
import { generateJwtToken } from "../../utility/AuthUtility.js";
import { generateOTP, sendOTPByEmail } from "../../utility/AuthUtility.js";
import { verifyJwtToken, verifyUser } from "../../utility/AuthUtility.js";
const prisma = new PrismaClient();
export const PulseSignUp = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw createHttpError(400, "Email and Password are required");
        }
        const otpRecord = await prisma.otp.findFirst({
            where: { email },
            select: { otp: true, expiresAt: true }
        });
        let otp;
        if (otpRecord && otpRecord.expiresAt > new Date()) {
            otp = otpRecord.otp;
        }
        else {
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
    }
    catch (error) {
        next(error);
    }
};
export const PulseverifyOTP = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
export const PulseSignIn = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
export const pulseLogout = (req, res, next) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict"
        });
        res.status(200).json({
            message: "Logout Successful"
        });
    }
    catch (error) {
        next(createHttpError(500, "Failed to log out"));
    }
};
export const fetchClientUser = async (req, res, next) => {
    const cookie = req.headers.cookie;
    try {
        const token = cookie
            ?.split(";")
            .map(cookie => cookie.trim()).find(cookie => cookie.startsWith("token"))
            ?.split('=')[1];
        if (!token) {
            throw createHttpError("Invalid Request");
        }
        const projectToken = cookie
            ?.split(";")
            .map(cookie => cookie.trim()).find(cookie => cookie.startsWith("projectName"))
            ?.split('=')[1];
        if (!projectToken) {
            throw createHttpError("Invalid projectName");
        }
        const decoded = await verifyJwtToken(token);
        const apiKey = decoded.userId;
        const verifieduser = verifyUser(apiKey);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Credentials");
        }
        const decodedProjectName = await verifyJwtToken(projectToken);
        console.group(decodedProjectName);
        const project = await prisma.project.findUnique({
            where: {
                projectName: decodedProjectName.userId,
            },
        });
        if (!project) {
            throw createHttpError(404, "Project not found");
        }
        const users = await prisma.clientUser.findMany({
            where: {
                projectId: project.id,
            },
            select: {
                email: true
            }
        });
        res.status(200).json({ data: users });
    }
    catch (error) {
        next(error);
    }
};
