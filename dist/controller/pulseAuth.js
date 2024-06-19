import createHttpError from "http-errors";
import { hashString, generateApiKey, verifyPassword } from "../utility/AuthUtility.js";
import { PrismaClient } from "@prisma/client";
import { generateJwtToken } from "../utility/AuthUtility.js";
const prisma = new PrismaClient();
export const PulseSignUp = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw createHttpError(400, "Email and Password are required");
        }
        const hashedPassword = await hashString(password);
        const apiKey = await generateApiKey({ email, password });
        const newUser = await prisma.pulseUser.create({
            data: {
                email,
                password: hashedPassword,
                apiKey,
                signupType: "EMAIL_PASSWORD"
            }
        });
        res.status(201).json({
            message: "User created Successfully",
            user: {
                apiKey: newUser.apiKey,
                email: newUser.email,
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
        });
        if (!user) {
            throw createHttpError(401, "Invalid Email or Password");
        }
        const verifiedPassword = await verifyPassword(password, user.password);
        if (!verifiedPassword) {
            throw createHttpError(401, "Invalid Email or Password");
        }
        const token = await generateJwtToken(user.apiKey);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
        });
        res.status(200).json({
            message: "Login Successfull",
            user: {
                apiKey: user.apiKey,
                email: user.email,
                token: token
            }
        });
    }
    catch (error) {
        next(error);
    }
};
