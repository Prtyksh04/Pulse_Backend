import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { createHmac } from "crypto";
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient;
export const hashString = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }
    catch (error) {
        throw createHttpError("Error in hashing the password ");
    }
};
export const verifyPassword = async (password, hashedPassword) => {
    try {
        const match = await bcrypt.compare(password, hashedPassword);
        return match;
    }
    catch (error) {
        throw createHttpError("Error verifying Password");
    }
};
export const generateApiKey = async (data) => {
    const combinedData = `${data.email}-${data.password}`;
    const secret = process.env.GENERATE_API_KEY;
    if (!secret) {
        throw new Error('API_KEY_SECRET is not defined in the environment variables.');
    }
    const apiKey = createHmac("sha256", secret).update(combinedData).digest("hex");
    return apiKey;
};
export const generateJwtToken = async (userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "100y",
    });
    return token;
};
export const verifyJwtToken = async (token) => {
    console.log("Jwt function token :", token);
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decode :", decode);
        return decode;
    }
    catch (error) {
        throw createHttpError(401, "Invalid request");
    }
};
export const verifyUser = async (apiKey) => {
    const verifiedUser = await prisma.pulseUser.findUnique({
        where: {
            apiKey
        }
    });
    return verifiedUser;
};
