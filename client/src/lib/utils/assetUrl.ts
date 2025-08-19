const BASE_URL = import.meta.env.PROD ? '/assets' : 'http://localhost:3000/assets';

export const getColoringBookPageAssetUrl = (bookId: number, orderIndex: number) => {
	return {
		originalImage: `${BASE_URL}/coloring-books/${bookId}/pages/${orderIndex}/original.jpg`,
		thumbnail: `${BASE_URL}/coloring-books/${bookId}/pages/${orderIndex}/thumbnail.jpg`,
		regions: `${BASE_URL}/coloring-books/${bookId}/pages/${orderIndex}/regions.svg`,
		colors: `${BASE_URL}/coloring-books/${bookId}/pages/${orderIndex}/colors.json`,
		audio: `${BASE_URL}/coloring-books/${bookId}/pages/${orderIndex}/audio.mp3`
	};
};

export const getColoringBookCover = (bookId: number) =>
	`${BASE_URL}/coloring-books/${bookId}/cover.jpg`;
