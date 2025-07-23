import { CookieOptions } from "express";

export const cookieConfig: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production', // set to true in production
	sameSite: 'strict',
	maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};
