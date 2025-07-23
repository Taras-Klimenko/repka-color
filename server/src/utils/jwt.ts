import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

export type JwtPayload = {
	userId: number;
	email: string;
};

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
	throw new Error('JWT secrets are not configured in the environment variables');
}

export class JwtUtils {
	static signAccessToken(payload: JwtPayload): string {
		return jwt.sign(payload, ACCESS_TOKEN_SECRET!, { expiresIn: '15m' });
	}

	static signRefreshToken(payload: JwtPayload): string {
		return jwt.sign(payload, REFRESH_TOKEN_SECRET!, { expiresIn: '7d' });
	}

	static verifyAccessToken(token: string): JwtPayload {
		return jwt.verify(token, ACCESS_TOKEN_SECRET!) as JwtPayload;
	}

	static verifyRefreshToken(token: string): JwtPayload {
		return jwt.verify(token, REFRESH_TOKEN_SECRET!) as JwtPayload;
	}
}
