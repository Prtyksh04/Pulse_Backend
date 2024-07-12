import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import dotenv from 'dotenv';

dotenv.config();

interface AttemptRecord {
  count: number;
  lastAttemptTime: number;
}

const loginAttempts: Record<string, AttemptRecord> = {};

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || "5", 10);
const COOLDOWN_PERIOD = parseInt(process.env.COOLDOWN_PERIOD || "3600", 10) * 1000;

setInterval(() => {
  const now = Date.now();
  Object.keys(loginAttempts).forEach(email => {
    if (now - loginAttempts[email].lastAttemptTime >= COOLDOWN_PERIOD) {
      delete loginAttempts[email];
    }
  });
}, COOLDOWN_PERIOD);

const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;

  if (!email) {
    throw createHttpError(400, 'Email is Required');
  }

  const now = Date.now();
  const attempts = loginAttempts[email]?.count || 0;
  const lastAttemptTime = loginAttempts[email]?.lastAttemptTime || 0;

  if (attempts >= RATE_LIMIT && now - lastAttemptTime < COOLDOWN_PERIOD) {
    const waitTime = Math.ceil((COOLDOWN_PERIOD - (now - lastAttemptTime)) / 1000);
    res.status(429).json({message : `Too Many attempts . Try again in ${waitTime} secounds`});
  }

  loginAttempts[email] = {
    count: attempts + 1,
    lastAttemptTime: now
  };

  next();
};

export default rateLimiter;
