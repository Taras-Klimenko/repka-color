import { axiosInstance } from '$lib/shared/axiosInstance';

export type ColoringBook = {
	id: number;
	title: string;
	description?: string;
	pageCount: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type ColoringBookPage = {
	id: number;
	title: string;
	orderIndex: number;
	description?: string;
	isActive: boolean;
	coloringBookId: number;
	coloringBook: {
		id: number;
		title: string;
	};
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

	static async getColoringBookPages(bookId: string): Promise<ColoringBookPage[]> {
		const { data } = await axiosInstance.get(`/coloring-books/${bookId}/pages`);
		return data.data;
	}

	static async getColoringBookPageById(pageId: string): Promise<ColoringBookPage> {
		const { data } = await axiosInstance.get(`coloring-books/pages/${pageId}`);
		return data.data;
	}

	static async getColoringBookPageByBookAndOrder(
		bookId: string,
		orderIndex: string
	): Promise<ColoringBookPage> {
		const { data } = await axiosInstance.get(`/coloring-books/${bookId}/pages/${orderIndex}`);
		return data.data;
	}
}
