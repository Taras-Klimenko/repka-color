import { getColoringBookPageAssetUrl } from '$lib/utils/assetUrl';
import { ColoringBookApi, type ColoringBookPage } from './coloringBookApi';
import type { Color } from '$lib/types';

export type PageAssets = {
	page: ColoringBookPage;
	assets: {
		originalImage: string;
		thumbnail: string;
		regions: string;
		colors: string;
		audio: string;
	};
	loadedData: {
		colors: Color[];
		svg: string;
	};
};

export class AssetLoader {
	static async loadPageAssets(bookId: number, orderIndex: number): Promise<PageAssets> {
		const assets = getColoringBookPageAssetUrl(bookId, orderIndex);

		const pageData = await ColoringBookApi.getColoringBookPageByBookAndOrder(
			bookId.toString(),
			orderIndex.toString()
		);

		const [colorsData, svgData] = await Promise.all([
			fetch(assets.colors).then((res) => res.json()),
			fetch(assets.regions).then((res) => res.text())
		]);

		return {
			page: pageData,
			assets,
			loadedData: {
				colors: colorsData,
				svg: svgData
			}
		};
	}
}
