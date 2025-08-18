import { writable, derived } from 'svelte/store';
import { AuthApi, type AuthResponse, type User } from '$lib/entities/authApi';

type AuthState = {
	user: User | null;
	isAuthenticated: boolean;
	isGuest: boolean;
	isLoading: boolean;
	isInitialized: boolean;
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isAuthenticated: false,
		isGuest: false,
		isLoading: true,
		isInitialized: false
	});

	return {
		subscribe,

		async initialize() {
			update((state) => ({ ...state, isLoading: true }));

			try {
				const token = localStorage.getItem('accessToken');
				if (token) {
					const response = await AuthApi.getCurrentUser();
					this.setUser(response.user);
				}
			} catch (error) {
				console.error('Failed to initialize auth state:', error);
				this.logout();
			} finally {
				update((state) => ({ ...state, isLoading: false, isInitialized: true }));
			}
		},

		setUser(user: User) {
			update((state) => ({
				...state,
				user,
				isAuthenticated: true,
				isGuest: user.isGuest || false,
				isLoading: false
			}));
		},

		loginAsGuest() {
			const guestUser = AuthApi.createGuestUser();
			this.setUser(guestUser);
		},

		async logout() {
			await AuthApi.logout();
			set({
				user: null,
				isAuthenticated: false,
				isGuest: false,
				isLoading: false,
				isInitialized: true
			});
		},

		async handleAuthSuccess(authResponse: AuthResponse) {
			this.setUser(authResponse.user);
		},

		setLoading(isLoading: boolean) {
			update((state) => ({ ...state, isLoading }));
		}
	};
}

export const authStore = createAuthStore();

export const user = derived(authStore, ($authStore) => $authStore.user);
export const isAuthenticated = derived(authStore, ($authStore) => $authStore.isAuthenticated);
export const isGuest = derived(authStore, ($authStore) => $authStore.isGuest)
export const isLoading = derived(authStore, ($authStore) => $authStore.isLoading);
export const isInitialized = derived(authStore, ($authStore) => $authStore.isInitialized);
