import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD ? '/api/v1' : 'http://localhost:3000/api/v1';

export const axiosInstance = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json'
	}
});

// Request interceptor
axiosInstance.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('accessToken');

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		const isAuthEndpoint =
			originalRequest.url?.includes('/register') || originalRequest.url?.includes('/login');
		const shouldSkipRefresh = isAuthEndpoint || originalRequest._retry;

		if (error.response?.status === 401 && !shouldSkipRefresh) {
			originalRequest._retry = true;

			try {
				const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true, headers: { 'Content-Type': 'application/json' } });
				const { accessToken } = data.data;

				localStorage.setItem('accessToken', accessToken);

				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return axiosInstance(originalRequest);
			} catch (refreshError) {
				localStorage.removeItem('accessToken');
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);
