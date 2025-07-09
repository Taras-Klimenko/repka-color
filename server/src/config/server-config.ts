import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../routes/index.router';

export interface ServerConfig {
	cors?: {
		origin?: string | string[];
		credentials?: boolean;
	};
	port?: number;
}

export function configureServer(app: Application, config: ServerConfig = {}): Application {
	const {
		cors: corsConfig = {
			origin: process.env.CORS_ORIGIN || '*',
			credentials: true
		},
		port = parseInt(process.env.PORT || '3000')
	} = config;

	// Basic middleware
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(cookieParser());

	// CORS configuration
	if (corsConfig) {
		const cors = require('cors');
		app.use(cors(corsConfig));
	}

	// Request logging middleware
	app.use((req, res, next) => {
		console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
		next();
	});

	// Mount API routes
	app.use(apiRouter);

	// Error handling middleware
	app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
		console.error('Error:', err.stack);
		res.status(500).json({
			error: 'Internal server error',
			message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
		});
	});

	// 404 handler - must be last (Express 5.x wildcard pattern)
	app.use('/*splat', (req, res) => {
		res.status(404).json({
			error: 'Route not found',
			path: req.originalUrl,
			method: req.method
		});
	});

	return app;
}
