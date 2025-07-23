import express from 'express';
import dotenv from 'dotenv'
import { configureServer } from './config/server-config';
import { prisma } from './services/prisma';

dotenv.config();

const app = express();

// Configure the server with all middleware and settings
configureServer(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server running on port: ${PORT}`);
	console.log(`Health check available at: http://localhost:${PORT}/api/v1/health`);
});

process.on('SIGINT', async () => {
	console.log('Shutting down database connection...');
	await prisma.$disconnect();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	console.log('Shutting down database connection...');
	await prisma.$disconnect();
	process.exit(0);
});