import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { hashString,generateApiKey, verifyPassword } from "../../utility/AuthUtility.js";
import { PrismaClient } from "@prisma/client";
import { generateJwtToken } from "../../utility/AuthUtility.js";
import {PulseAuthBodyType} from "../../schema/userSchema.js";

const prisma = new PrismaClient();


export const PulseSignUp :RequestHandler = async(req:Request<{},{},PulseAuthBodyType> , res : Response , next : NextFunction)=>{
    const {email , password} = req.body;
    try {
        if(!email || !password){
            throw createHttpError(400 , "Email and Password are required");
        }
        const hashedPassword = await hashString(password);
        const apiKey = await  generateApiKey({email , password});
        const newUser = await prisma.pulseUser.create({
            data:{
                email,
                password:hashedPassword,
                apiKey,
            }
        });
        res.status(201).json({
            message:"User created Successfully",
            user:{
                apiKey:newUser.apiKey,
                email:newUser.email,
            }
        });
    } catch (error) {
        next(error)
    }
}

export const PulseSignIn :RequestHandler = async(req:Request<{},{},PulseAuthBodyType> , res : Response , next : NextFunction)=>{
    const {email , password} = req.body;
    try {
        if(!email || !password){
            throw createHttpError(400 , "Email and Password are required");
        }

        const user = await prisma.pulseUser.findUnique({
            where : {email},
        });
        if(!user){
            throw createHttpError(401,"Invalid Email or Password");
        }

        const verifiedPassword = await verifyPassword(password , user.password);

        if(!verifiedPassword){
            throw createHttpError(401,"Invalid Email or Password");
        }
        const token = await generateJwtToken(user.apiKey);
        res.cookie("token",token,{
            httpOnly:true,
            sameSite:"strict",
        });

        res.status(200).json({
            message:"Login Successfull",
            user :{
                apiKey : user.apiKey,
                email:user.email,
                token:token
            }
        });
    } catch (error) {
        next(error)
    }
}

export const pulseLogout =(req:Request , res: Response , next : NextFunction)=>{
    try {
        res.clearCookie("token",{
            httpOnly:true,
            sameSite:"strict"
        });
        res.status(200).json({
            message:"Logout Successful"
        })
        
    } catch (error) {
        next(createHttpError(500 , "Failed to log out"));
    }
}

