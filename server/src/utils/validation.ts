export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

export class AuthValidator {
	private static validateEmail(email: string): ValidationError | null {
		if (!email) {
			return { field: 'email', message: 'Email is required' };
		}

		if (typeof email !== 'string') {
			return { field: 'email', message: 'Provided email must be a string value' };
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return { field: 'email', message: 'Invalid email format' };
		}

		if (email.length > 250) {
			return { field: 'email', message: 'Email is too long (max 250 characters)' };
		}

		return null;
	}

	private static ValidatePassword(password: string): ValidationError | null {
		if (!password) {
			return { field: 'email', message: 'Email is required' };
		}

		if (typeof password !== 'string') {
			return { field: 'password', message: 'Provided password must be a string value' };
		}

		if (password.length < 8) {
			return { field: 'password', message: 'Password must be at least 8 characters long' };
		}

		if (password.length > 128) {
			return { field: 'password', message: 'Password is too long (max 128 characters)' };
		}

		if (!/[A-Z]/.test(password)) {
			return { field: 'password', message: 'Password must contain at least one uppercase letter' };
		}

		if (!/[a-z]/.test(password)) {
			return { field: 'password', message: 'Password must contain at least one lowercase letter' };
		}

		if (!/\d/.test(password)) {
			return { field: 'password', message: 'Password must contain at least one number' };
		}

		return null;
	}

	static ValidateRegistrationData(data: any): ValidationResult {
		const errors: ValidationError[] = [];

		const emailError = this.validateEmail(data.email);
		if (emailError) {
			errors.push(emailError);
		}

		const passwordError = this.ValidatePassword(data.password);
		if (passwordError) {
			errors.push(passwordError);
		}

		return { isValid: errors.length === 0, errors };
	}

	static ValidateLoginData(data: any): ValidationResult {
		const errors: ValidationError[] = [];

		const emailError = this.validateEmail(data.email);
		if (emailError) {
			errors.push(emailError);
		}

		if (!data.password) {
			errors.push({ field: 'password', message: 'Password is required' });
		} else if (typeof data.password !== 'string') {
			errors.push({ field: 'password', message: 'Provided password must be a string value' });
		}

		return { isValid: errors.length === 0, errors };
	}
}
