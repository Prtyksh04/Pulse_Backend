import createHttpError from "http-errors";
import { PrismaClient } from "@prisma/client";
import { hashString, verifyJwtToken, verifyPassword, verifyUser } from "../../utility/AuthUtility.js";
const prisma = new PrismaClient();
var SignupType;
(function (SignupType) {
    SignupType["EMAIL_PASSWORD"] = "EMAIL_PASSWORD";
    SignupType["EMAIL_USERNAME_PASSWORD"] = "EMAIL_USERNAME_PASSWORD";
    SignupType["GOOGLE_AUTH"] = "GOOGLE_AUTH";
    SignupType["GITHUB_AUTH"] = "GITHUB_AUTH";
})(SignupType || (SignupType = {}));
const throwError = (status, message) => {
    throw createHttpError(status, message);
};
const createClientUser = async (data) => {
    return await prisma.clientUser.create({ data });
};
const checkClientUserUsingEmail = async (data) => {
    return await prisma.clientUser.findUnique({
        where: {
            email: data.email
        }, select: {
            password: true,
            email: true,
        }
    });
};
const checkClientUserUsingEmailOrUsername = async (data) => {
    console.log(data);
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
};
export const AuthSignUp = async (req, res, next) => {
    const { email, password, username, projectName, apiKey } = req.body;
    console.log(req.body);
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
        const userId = verifieduser.apiKey;
        const project = await verifyJwtToken(projectName);
        if (!project) {
            throw createHttpError("Cannot find the Signup type");
        }
        const projectIdentified = await prisma.project.findUnique({
            where: {
                projectName: project.userId,
                userId: userId
            },
            select: {
                signupType: true,
                id: true,
            }
        });
        if (!projectIdentified) {
            throw createHttpError(404, "project Not found");
        }
        let clientUser;
        switch (projectIdentified.signupType) {
            case SignupType.EMAIL_PASSWORD:
                if (!email || !password)
                    throwError(400, "Password & email are required for email-password signup");
                const hashedPassword = await hashString(password);
                clientUser = await createClientUser({
                    email,
                    password: hashedPassword,
                    project: { connect: { id: projectIdentified.id } }
                });
                break;
            case SignupType.EMAIL_USERNAME_PASSWORD:
                if (!email || !password || !username)
                    throwError(400, "Email, username, and password are required for email-username-password signup");
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
            message: "User Created Successfully",
            data: { user: clientUser }
        });
    }
    catch (error) {
        next(error);
    }
};
export const AuthSignIn = async (req, res, next) => {
    const { password, email, projectName, apiKey } = req.body;
    console.log(req.body);
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
        const userId = verifieduser.apiKey;
        const project = await verifyJwtToken(projectName);
        if (!project) {
            throw createHttpError("Cannot find the Signup type");
        }
        const projectIdentified = await prisma.project.findUnique({
            where: {
                projectName: project.userId,
                userId: userId
            },
            select: {
                signupType: true,
                id: true,
            }
        });
        if (!projectIdentified) {
            throw createHttpError(404, "project Not found");
        }
        console.log("Auth Singin Singuptype console.log : ", projectIdentified?.signupType);
        let clientUser;
        switch (projectIdentified.signupType) {
            case SignupType.EMAIL_PASSWORD:
                if (!email || !password)
                    throwError(400, "Password & email are required for email-password signup");
                clientUser = await checkClientUserUsingEmail({ email });
                if (!clientUser?.password) {
                    throw throwError(400, "Password is Required for authentication");
                }
                console.log("clientUser.password", clientUser.password);
                console.log("password :", password);
                const verifiedPassword = await verifyPassword(password, clientUser.password);
                if (!verifiedPassword) {
                    throwError(400, "Invalid Request");
                }
                break;
            case SignupType.EMAIL_USERNAME_PASSWORD:
                if (!password || (!email))
                    throwError(400, "Email, username, and password are required for email-username-password signup");
                clientUser = await checkClientUserUsingEmailOrUsername({ email });
                if (!clientUser?.password) {
                    throw throwError(400, "Password is Required for authentication");
                }
                console.log("clientUser.password", clientUser.password);
                console.log("password", password);
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
    }
    catch (error) {
        next(error);
    }
};
export const AuthLogout = (req, res, next) => {
    try {
    }
    catch (error) {
        next(error);
    }
};
export const formType = async (req, res, next) => {
    const { token, projectName } = req.body;
    console.log(req.body);
    try {
        const verifiedToken = await verifyJwtToken(token);
        if (!verifiedToken) {
            throw createHttpError("User Not identified");
        }
        console.log("decodeUser : ", verifiedToken);
        const verifieduser = await verifyUser(verifiedToken.userId);
        console.log("verifieduser : ", verifieduser);
        if (!verifieduser) {
            throw createHttpError(401, "Invalid Request");
        }
        const userId = verifieduser.apiKey;
        const project = await verifyJwtToken(projectName);
        if (!project) {
            throw createHttpError("Cannot find the Signup type");
        }
        console.log("project : ", project);
        const projectIdentified = await prisma.project.findUnique({
            where: {
                projectName: project.userId,
                userId: userId
            },
            select: {
                signupType: true,
            }
        });
        console.log("projectIdentified : ", projectIdentified);
        const formtype = projectIdentified?.signupType;
        if (!formtype) {
            throw createHttpError("Invalid Form type , Please try again");
        }
        console.log("formtype : ", formtype);
        res.status(200).json(formtype);
    }
    catch (error) {
        next(error);
    }
};
