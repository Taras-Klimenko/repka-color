import { writable, derived, get } from 'svelte/store';
import { user } from './userState';
import { UserProgressApi, type UserPageProgress } from '$lib/entities/userProgressApi';

type UserProgressState = {
	progressCache: Map<number, UserPageProgress>;
	pendingProgressUpdates: Map<number, NodeJS.Timeout>;
	isLoading: boolean;
	error: string | null;
};

function createUserProgressStore() {
	const { subscribe, set, update } = writable<UserProgressState>({
		progressCache: new Map(),
		pendingProgressUpdates: new Map(),
		isLoading: false,
		error: null
	});

	return {
		subscribe,

		getCachedProgress(pageId: number): UserPageProgress | null {
			let result: UserPageProgress | null = null;
			subscribe((state) => {
				result = state.progressCache.get(pageId) || null;
			})();
			return result;
		},

		async updatePageProgress(pageId: number, progressPercentage: number, currentColors?: any) {
			const currentUser = get(user);

			if (!currentUser) {
				return;
			}

			update((state) => {
				const existingTimeout = state.pendingProgressUpdates.get(pageId);
				if (existingTimeout) {
					clearTimeout(existingTimeout);
				}
				return state;
			});

			const timeoutId = setTimeout(async () => {
				try {
					const updatedProgress = await UserProgressApi.updateUserPageProgress(
						currentUser.id,
						pageId,
						{ progressPercentage, currentColors }
					);
					update((state) => {
						const newCache = new Map(state.progressCache);
						newCache.set(pageId, updatedProgress);
						const newPendingUpdates = new Map(state.pendingProgressUpdates);
						newPendingUpdates.delete(pageId);

						return {
							...state,
							progressCache: newCache,
							pendingProgressUpdates: newPendingUpdates,
							error: null
						};
					});
				} catch (error) {
					console.error('Error updating page progress:', error);
					update((state) => ({ ...state, error: 'Failed to update progress' }));
				}
			}, 2000);

			update((state) => {
				const newPendingUpdates = new Map(state.pendingProgressUpdates);
				newPendingUpdates.set(pageId, timeoutId);
				return {
					...state,
					pendingProgressUpdates: newPendingUpdates
				};
			});
		},

		async loadPageProgress(pageId: number): Promise<UserPageProgress | null> {
			const currentUser = get(user);

			if (!currentUser) {
				return null;
			}
			const cachedProgress = this.getCachedProgress(pageId);

			if (cachedProgress) {
				return cachedProgress;
			}

			try {
				const progress = await UserProgressApi.getUserPageProgress(currentUser.id, pageId);

				if (progress) {
					update((state) => {
						const newCache = new Map(state.progressCache);
						newCache.set(pageId, progress);
						return {
							...state,
							progressCache: newCache
						};
					});
				}
				return progress;
			} catch (error) {
				console.error('Error loading page progress:', error);
				return null;
			}
		}
	};
}

export const userProgressStore = createUserProgressStore();
