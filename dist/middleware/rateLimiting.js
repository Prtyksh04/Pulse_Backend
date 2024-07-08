import createHttpError from 'http-errors';
// Track login attempts in memory
const loginAttempts = new Map();
const RATE_LIMIT = 5;
const COOLDOWN_PERIOD = 3600 * 1000; // 1 hour in milliseconds
const rateLimiter = (req, res, next) => {
    const email = req.body.email;
    if (!email) {
        throw createHttpError(400, 'Email is Required');
    }
    const attempts = loginAttempts.get(email) || 0;
    const currentTime = Date.now();
    if (attempts >= RATE_LIMIT) {
        const lastAttemptTime = loginAttempts.get(`${email}:lastAttemptTime`) || 0;
        if (currentTime - lastAttemptTime < COOLDOWN_PERIOD) {
            const waitTime = Math.ceil((COOLDOWN_PERIOD - (currentTime - lastAttemptTime)) / 1000);
            throw createHttpError(429, `Too many attempts . Try again in ${waitTime} seconds`);
        }
        else {
            loginAttempts.set(email, 0);
            loginAttempts.set(`${email}:lastAttemptTime`, 0);
        }
    }
    loginAttempts.set(email, attempts + 1);
    loginAttempts.set(`${email}:lastAttemptTime`, currentTime);
    next();
};
export default rateLimiter;
