import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtUtils } from '../utils/jwt';
import { cookieConfig } from '../config/cookie-config';
import formatResponse from '../utils/formatResponse';
import { JwtPayload } from '../utils/jwt';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export class AuthController {
	/**
	 * Register a new user
	 */
	static async register(req: Request, res: Response) {
		try {
			const { email, password } = req.body;

			const userExists = await AuthService.userExists(email);

			if (userExists) {
				res.status(409).json(formatResponse(409, 'User with this email already exists'));
				return;
			}

			const user = await AuthService.registerUser({ email, password });

			const payload = { userId: user.id, email: user.email };
			const accessToken = JwtUtils.signAccessToken(payload);
			const refreshToken = JwtUtils.signRefreshToken(payload);

			res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieConfig);

			res
				.status(201)
				.json(formatResponse(201, 'User registered successfully', { user, accessToken }));
			return;
		} catch (error) {
			console.error('Registration error:', error);
			res.status(500).json(formatResponse(500, 'Failed to register user', null, error));
		}
	}

	/**
	 * Login user
	 */
	static async login(req: Request, res: Response) {
		try {
			const { email, password } = req.body;

			const user = await AuthService.verifyCredentials(email, password);

			if (!user) {
				res.status(401).json(formatResponse(401, 'Invalid email or password'));
				return;
			}

			const payload = { userId: user.id, email: user.email };
			const accessToken = JwtUtils.signAccessToken(payload);
			const refreshToken = JwtUtils.signRefreshToken(payload);

			res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieConfig);

			res.json(formatResponse(200, 'Login successful', { user, accessToken }));
			return;
		} catch (error) {
			console.error('Login error:', error);
			res.status(500).json(formatResponse(500, 'Failed to login', null, error));
		}
	}

	/**
	 * Get current user info
	 */
	static async getCurrentUser(req: Request, res: Response) {
		try {
			// TODO: Extract user from JWT token

			res.json(formatResponse(200, 'Current user endpoint - not implemented yet'));
		} catch (error) {
			console.error('Get current user error:', error);
			res.status(500).json(formatResponse(500, 'Failed to get current user', null, error));
		}
	}

	/**
	 * Logout user
	 */
	static async logout(req: Request, res: Response) {
		try {
			res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, cookieConfig);
			res.json(formatResponse(200, 'Logout successful'));
		} catch (error) {
			console.error('Logout error:', error);
			res.status(500).json(formatResponse(500, 'Failed to logout', null, error));
		}
	}

	static async refreshToken(req: Request, res: Response) {
		try {
			const token = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

			if (!token) {
				res.status(401).json(formatResponse(401, 'Refresh token not found'));
				return;
			}

			let payload: JwtPayload;
			try {
				payload = JwtUtils.verifyRefreshToken(token);
			} catch (error) {
				res.status(401).json(formatResponse(401, 'Invalid refresh token', null, error));
				return;
			}

			const accessToken = JwtUtils.signAccessToken({
				userId: payload.userId,
				email: payload.email
			});
			res.json(formatResponse(200, 'Token refreshed', { accessToken }));
			return;
		} catch (error) {
			console.error('Refresh token error: ', error);
			res.status(500).json(formatResponse(500, 'Token refresh failed', null, error));
			return;
		}
	}
}
