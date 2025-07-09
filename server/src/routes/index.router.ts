import { Router } from 'express';
import { authRouter } from './auth.router';

const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

router.get(`${API_PREFIX}/health`, (req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		port: process.env.PORT || 3000
	});
});

// API info endpoint
router.get(API_PREFIX, (req, res) => {
	res.json({
		message: 'Repka Color API',
		version: '1.0.0',
		endpoints: {
			health: '/health',
			auth: {
				register: '/auth/register',
				login: '/auth/login',
				logout: '/auth/logout',
				me: '/auth/me'
			}
		}
	});
});

router.use(`${API_PREFIX}/auth`, authRouter);

export { router as apiRouter };
