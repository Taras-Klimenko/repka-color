import { Request, Response, NextFunction } from 'express';
import { AuthValidator } from '../utils/validation';
import formatResponse from '../utils/formatResponse';

export class ValidationMiddleware {
	static validateRegistration(req: Request, res: Response, next: NextFunction): void {
		const validationResult = AuthValidator.ValidateRegistrationData(req.body);

		if (!validationResult.isValid) {
			res.status(400).json(formatResponse(400, 'Validation error', null, validationResult.errors));
			return;
		}

		next();
	}

	static validateLogin(req: Request, res: Response, next: NextFunction): void {
		const validationResult = AuthValidator.ValidateLoginData(req.body);

		if (!validationResult.isValid) {
			res.status(400).json(formatResponse(400, 'Validation error', null, validationResult.errors));
			return;
		}

		next();
	}
}
