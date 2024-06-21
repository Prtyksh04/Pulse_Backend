import createHttpError from "http-errors";
import { verifyJwtToken } from "../utility/AuthUtility.js";
export const verifyAuthToken = (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) {
        return next(createHttpError("No Cookie Found"));
    }
    const token = cookie
        ?.split(";")
        .map(cookie => cookie.trim()).find(cookie => cookie.startsWith("token"))
        ?.split('=')[1];
    if (!token) {
        throw createHttpError(401, "Access Denied : No Token Provided");
    }
    try {
        const decoded = verifyJwtToken(token);
        next();
    }
    catch (error) {
        next(createHttpError(401, "invalid Token"));
    }
};
