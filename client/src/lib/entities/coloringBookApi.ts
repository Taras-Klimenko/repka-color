import { axiosInstance } from '$lib/shared/axiosInstance';

export type ColoringBook = {
	id: number;
	title: string;
	coverImage: string;
	description?: string;
	pageCount: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export class ColoringBookApi {
	static async getColoringBooks(): Promise<ColoringBook[]> {
		const { data } = await axiosInstance.get('/coloring-books');
		return data.data;
	}

	static async getColoringBook(id: string): Promise<ColoringBook> {
		const { data } = await axiosInstance.get(`/coloring-books/${id}`);
		return data.data;
	}
}
