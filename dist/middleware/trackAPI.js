import redisClient from "../redisClient.js";
import { PrismaClient } from "@prisma/client";
import createHttpError from "http-errors";
import { verifyJwtToken, verifyUser } from "../utility/AuthUtility.js";
const prisma = new PrismaClient();
export const trackAPI = async (req, res, next) => {
    const cookie = req.headers.cookie;
    const route = req.path;
    console.log("cookie", cookie);
    try {
        const token = cookie
            ?.split(";")
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith("token"))
            ?.split('=')[1];
        if (!token) {
            throw createHttpError(400, "Invalid Request: Token not found");
        }
        const projectToken = cookie
            ?.split(";")
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith("projectToken"))
            ?.split('=')[1];
        if (!projectToken) {
            throw createHttpError(400, "Invalid Request: Project token not found");
        }
        const decoded = await verifyJwtToken(token);
        const apiKey = decoded.userId;
        const verifiedUser = await verifyUser(apiKey);
        if (!verifiedUser) {
            throw createHttpError(401, "Invalid Credentials");
        }
        const decodedProjectName = await verifyJwtToken(projectToken);
        const projectName = decodedProjectName.userId;
        if (projectName && apiKey) {
            const key = `${projectName}:${apiKey}:${route}`;
            try {
                await redisClient.incr(key);
            }
            catch (redisError) {
                console.error("Error incrementing Redis key:", redisError);
                // Handle Redis errors (optional: send response or log error)
            }
        }
        next();
    }
    catch (error) {
        console.error("Error in trackAPI middleware:", error);
        next(error);
    }
};
