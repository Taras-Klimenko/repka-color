import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import {
	labelRegions,
	toBinaryMatrix,
	renderRegionsImage,
	computeRegionColors,
	saveRegionMasks,
	computeRegionColor,
	countWhitePixels,
	generateMask,
	extractOutlinesSVG
} from './utils';

const MIN_REGION_PIXELS = 100;

const inputPath = path.resolve('src/lib/assets/original/corgi-cat-test-again.jpg');
const grayPath = path.resolve('src/lib/assets/processed/grayscale.png');
const thresholdPath = path.resolve('src/lib/assets/processed/threshold.png');
const maskOutputDir = path.resolve('src/lib/assets/processed/region-masks');
const regionColorPath = path.resolve('src/lib/assets/processed/region-colors.json');

async function main() {
	const { data, info } = await sharp(inputPath)
		.grayscale()
		.threshold(128)
		.raw()
		.toBuffer({ resolveWithObject: true });

	const binaryImage = toBinaryMatrix(data, info.width, info.height);

	const labelMap = labelRegions(binaryImage);
	const height = labelMap.length;
	const width = labelMap[0].length;

	let maxLabel = 0;
	for (const row of labelMap) {
		for (const val of row) {
			if (val > maxLabel) maxLabel = val;
		}
	}
	console.log('Number of regions:', maxLabel);

	const keptRegionColors: Record<number, { r: number; g: number; b: number }> = {};

	for (let regionId = 1; regionId <= maxLabel; regionId++) {
		const mask = generateMask(labelMap, regionId);
		const whitePixelCount = countWhitePixels(mask);

		if (whitePixelCount < MIN_REGION_PIXELS) continue;

		// Save the mask image
		const maskPath = path.join(maskOutputDir, `region-${regionId}.png`);
		await sharp(mask, {
			raw: { width, height, channels: 1 }
		})
			.raw()
			.toColourspace('b-w')
			.negate()
			.toFormat('png')
			.resize(info.width, info.height, { kernel: 'nearest' })
			.toFile(maskPath);

		// Compute region color from original image
		const color = await computeRegionColor(inputPath, mask);
		keptRegionColors[regionId] = color;
	}

	await fs.writeFile(regionColorPath, JSON.stringify(keptRegionColors, null, 2), 'utf-8');
	console.log(`Saved ${Object.keys(keptRegionColors).length} region colors.`);

	const outlinesSVGPath = path.resolve('src/lib/assets/processed/outlines.svg');
	await extractOutlinesSVG(inputPath, outlinesSVGPath);
}

main().catch(console.error);
