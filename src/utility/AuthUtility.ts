import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { createHmac } from "crypto";
import 'dotenv/config';
import jwt from "jsonwebtoken";
import { boolean } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient
export const hashString = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw createHttpError("Error in hashing the password ");
    }
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        const match = bcrypt.compare(password, hashedPassword);
        return match;
    } catch (error) {
        throw createHttpError("Error verifying Password");
    }
}

export const generateApiKey = async (data: { email: string, password: string }): Promise<string> => {
    const combinedData = `${data.email}-${data.password}`;
    const secret = process.env.GENERATE_API_KEY;
    if (!secret) {
        throw new Error('API_KEY_SECRET is not defined in the environment variables.');
    }
    const apiKey = createHmac("sha256", secret).update(combinedData).digest("hex");
    return apiKey;

}

export const generateJwtToken = async (userId: string): Promise<string> => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
    });
    return token;
}

export const verifyJwtToken = async (token: string) => {
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET!)
        return decode;
    } catch (error) {
        throw createHttpError(401, "Invalid request");
    }
}

export const verifyUser = async (apiKey: string) => {
    const verifiedUser = await prisma.pulseUser.findUnique({
        where: {
            apiKey
        }
    });
    return verifiedUser;

}
