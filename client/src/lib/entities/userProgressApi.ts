import { axiosInstance } from '$lib/shared/axiosInstance';

export type ProgressUpdateData = {
	progressPercentage: number;
	currentColors?: any;
};

export type UserPageProgress = {
	id: number;
	progressPercentage: number;
	currentColors: any;
	createdAt: Date;
	updatedAt: Date;
	coloringPageId: number;
	coloringPage?: {
		id: number;
		title: string;
		orderIndex: number;
		coloringBook: {
			id: number;
			title: string;
		};
	};
};

export class UserProgressApi {
	static async getUserPageProgress(
		userId: number,
		coloringPageId: number
	): Promise<UserPageProgress | null> {
		try {
			const { data } = await axiosInstance.get(`/user-progress/${userId}/${coloringPageId}`);
			return data.data;
		} catch (error) {
			console.error('Error fetching user page progress:', error);
			return null;
		}
	}

	static async getAllUserProgress(userId: number): Promise<UserPageProgress[]> {
		const { data } = await axiosInstance.get(`user-progress/${userId}`);
		return data.data;
	}

	static async getUserProgressByBookId(
		userId: number,
		bookId: number
	): Promise<UserPageProgress[]> {
		const { data } = await axiosInstance.get(`/user-progress/${userId}/book/${bookId}`);
		return data.data;
	}

	static async updateUserPageProgress(
		userId: number,
		coloringPageId: number,
		progressData: ProgressUpdateData
	): Promise<UserPageProgress> {
		const { data } = await axiosInstance.patch(
			`/user-progress/${userId}/${coloringPageId}`,
			progressData
		);
		return data.data;
	}
}
