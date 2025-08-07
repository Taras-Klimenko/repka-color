import { Router } from 'express';
import { authRouter } from './auth.router';
import { coloringBookRouter } from './coloringBook.router';
import { userProgressRouter } from './userProgress.router';

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
			auth: '/auth',
			coloringBooks: '/coloring-books'
		}
	});
});

router.use(`${API_PREFIX}/auth`, authRouter);
router.use(`${API_PREFIX}/coloring-books`, coloringBookRouter);
router.use(`${API_PREFIX}/user-progress`, userProgressRouter);

export { router as apiRouter };
