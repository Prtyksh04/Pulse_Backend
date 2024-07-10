import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { createHmac } from "crypto";
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";
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
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
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
export const generateOTP = () => {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};
export const sendOTPByEmail = async (email, otp) => {
    const transpoter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verification Code for Signup From Pulse",
        text: `Your OTP for Authentication is : ${otp} . This OTP is valid for 10 mins Only.`
    };
    await transpoter.sendMail(mailOptions);
};
