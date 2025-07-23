import { Router } from 'express';
import {ValidationMiddleware} from '../middleware/validation.middleware'
import { AuthController } from '../controllers/auth.controller';

const router = Router();

router.post('/register', ValidationMiddleware.validateRegistration, AuthController.register);
router.post('/login', ValidationMiddleware.validateLogin, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getCurrentUser);
router.post('/refresh', AuthController.refreshToken)

export { router as authRouter };
