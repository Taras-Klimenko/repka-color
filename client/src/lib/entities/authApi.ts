import { axiosInstance } from '$lib/shared/axiosInstance';

export type User = {
	id: number;
	email: string;
	username: string;
	createdAt: Date;
	updatedAt: Date;
};

export type LoginData = {
	email: string;
	password: string;
};

export type RegisterData = {
	email: string;
	password: string;
	username: string;
};

export type AuthResponse = {
	user: User;
	accessToken: string;
};

export class AuthApi {
	static async login(loginData: LoginData): Promise<AuthResponse> {
		const { data } = await axiosInstance.post('auth/login', loginData);
		const { accessToken } = data.data;
		localStorage.setItem('accessToken', accessToken);
		return data.data;
	}

	static async register(registerData: RegisterData): Promise<AuthResponse>{
		const { data } = await axiosInstance.post('/auth/register', registerData);
		const { accessToken } = data.data;
		localStorage.setItem('accessToken', accessToken);
		return data.data;
	}

	static async getCurrentUser(): Promise<{user: User}> {
		const {data} = await axiosInstance.get('/auth/me');
		return data.data
	}

	static async logout(): Promise<void> {
		await axiosInstance.post('/auth/logout');
		localStorage.removeItem('accessToken');
	}

	static async refresh(): Promise<{accessToken: string}> {
		const { data } = await axiosInstance.post('auth/refresh');
		const { accessToken } = data.data;
		localStorage.setItem('accessToken', accessToken);
		return data.data;
	}
}
