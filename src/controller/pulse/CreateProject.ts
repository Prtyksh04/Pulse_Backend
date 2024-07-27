import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import { projectBodytype } from "../../schema/projectSchema.js";
import { generateJwtToken } from "../../utility/AuthUtility.js";
import { PrismaClient } from "@prisma/client";
import { verifyJwtToken, verifyUser } from "../../utility/AuthUtility.js";
const prisma = new PrismaClient();

enum SignupType {
    EMAIL_PASSWORD = "EMAIL_PASSWORD",
    EMAIL_USERNAME_PASSWORD = "EMAIL_USERNAME_PASSWORD",
    GOOGLE_AUTH = "GOOGLE_AUTH",
    GITHUB_AUTH = "GITHUB_AUTH",
}

export const createApplication: RequestHandler = async (req: Request<{}, {}, projectBodytype>, res: Response, next: NextFunction) => {
    const { applicationName, signupType } = req.body;
    const cookie = req.headers.cookie;

    if (!cookie) {
        return next(createHttpError(400, "Invalid request"));
    }

    try {
        if (!applicationName) {
            throw createHttpError(400, "Application name is required");
        }

        const token = cookie
            ?.split(";")
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith("token"))
            ?.split('=')[1];

        if (!token) {
            throw createHttpError(400, "Invalid request");
        }

        const decoded = await verifyJwtToken(token) as { userId: string };
        const apiKey = decoded.userId;
        const verifiedUser = await verifyUser(apiKey);

        if (!verifiedUser) {
            throw createHttpError(401, "Invalid credentials");
        }

        // Check if the project already exists
        const existingProject = await prisma.project.findFirst({
            where: {
                projectName: applicationName,
                userId: apiKey,
            },
        });

        if (existingProject) {
            const variables = await prisma.viteEnvVariables.findFirst({
                where: {
                    projectName: existingProject.projectName,
                },
                select: {
                    projectToken: true,
                    apiKey: true,
                }
            });
            const projectToken = await generateJwtToken(existingProject.projectName);
            res.cookie("projectName", projectToken, {
                httpOnly: true,
                sameSite: "none",
                secure: true
            });
            return res.status(200).json({
                message: "Application selected successfully",
                project: {
                    token: variables?.apiKey,
                    projectName: variables?.projectToken,
                },
            });
        }

        if (signupType === undefined) {
            throw createHttpError(400, "Signup type is required for new project");
        }

        const newProject = await prisma.project.create({
            data: {
                projectName: applicationName,
                userId: apiKey,
                signupType: signupType as SignupType,
            },
        });

        const projectToken = await generateJwtToken(newProject.projectName);
        const updatedProject = await prisma.project.update({
            where: {
                id: newProject.id,
            },
            data: { clientApiKey: projectToken },
        });

        await prisma.viteEnvVariables.create({
            data: {
                projectName: newProject.projectName,
                apiKey: token,
                projectToken: projectToken,
            },
        });

        res.cookie("projectName", projectToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true
        });

        res.status(200).json({
            message: "Project created successfully",
            project: {
                token: token,
                projectName: projectToken,
            },
            updatedProject,
        });
    } catch (error) {
        next(error);
    }
};


export const getAllProjects: RequestHandler = async (req: Request<{}, {}, projectBodytype>, res: Response, next: NextFunction) => {
    const cookie = req.headers.cookie;

    if (!cookie) {
        return next(createHttpError(400, "Invalid request"));
    }

    try {
        const token = cookie
            ?.split(";")
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith("token"))
            ?.split('=')[1];

        if (!token) {
            throw createHttpError(400, "Invalid request");
        }

        const decoded = await verifyJwtToken(token) as { userId: string };
        const apiKey = decoded.userId;
        const verifiedUser = await verifyUser(apiKey);

        if (!verifiedUser) {
            throw createHttpError(401, "Invalid credentials");
        }

        const projects = await prisma.project.findMany({
            where: {
                userId: apiKey,
            },
            select: {
                projectName: true,
                id: true
            }
        });
        res.status(200).json({ projects: projects });
    } catch (error) {
        next(error);
    }
};


export const getEnvVariables: RequestHandler = async (req: Request<{}, {}, projectBodytype>, res: Response, next: NextFunction) => {
    const cookie = req.headers.cookie;
    try {
        if (!cookie) {
            return next(createHttpError(400, "Invalid request"));
        }

        const token = cookie
            ?.split(";")
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith("token"))
            ?.split('=')[1];

        if (!token) {
            throw createHttpError(400, "Invalid request");
        }

        const decoded = await verifyJwtToken(token) as { userId: string };
        const apiKey = decoded.userId;
        const verifiedUser = await verifyUser(apiKey);

        if (!verifiedUser) {
            throw createHttpError(401, "Invalid credentials");
        }
        const projectToken = cookie
            ?.split(";")
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith("projectName"))
            ?.split('=')[1];
        const projectName = await verifyJwtToken(projectToken as string);
        if (!projectName) {
            throw createHttpError
        }
        const variable = await prisma.viteEnvVariables.findFirst({
            where: {
                projectName: projectName.userId
            }, select: {
                apiKey: true,
                projectToken: true
            }
        });
        res.status(200).json(variable);

    } catch (error) {
        next(error);
    }
}
