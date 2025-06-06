import sharp from 'sharp';
import { trace } from 'potrace';
import fs from 'fs/promises';
import path from 'path';
import npyjs from 'npyjs';

export async function loadLabelMap(npyPath: string): Promise<number[][]> {
	const npy = new npyjs();

	// Read the .npy file as a buffer
	const buffer = await fs.readFile(npyPath);

	// Convert Node.js Buffer to ArrayBuffer
	const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

	// Parse with npyjs
	const data = npy.parse(arrayBuffer);

	const isTypedArray =
		data.data instanceof Int32Array ||
		data.data instanceof Uint32Array ||
		data.data instanceof Uint16Array ||
		data.data instanceof Uint8Array;

	const isBigIntArray = data.data instanceof BigInt64Array;

	if (!isTypedArray && !isBigIntArray) {
		throw new Error(`Unsupported array type: ${data.data.constructor.name}`);
	}

	const { shape } = data;
	const [height, width] = shape;
	const labelMap: number[][] = [];

	for (let y = 0; y < height; y++) {
		const row: number[] = [];
		for (let x = 0; x < width; x++) {
			const index = y * width + x;
			const value = data.data[index];
			row.push(isBigIntArray ? Number(value) : value);
		}
		labelMap.push(row);
	}

	return labelMap;
}

export async function extractOutlinesSVG(inputPath: string, outputPath: string): Promise<void> {
	const outlinesBuffer = await sharp(inputPath)
		.grayscale()
		.threshold(40) // keep only black lines (adjust as needed)
		.toBuffer();

	await new Promise<void>((resolve, reject) => {
		trace(
			outlinesBuffer,
			{
				threshold: 40,
				color: 'black',
				optTolerance: 0.4,
				turdSize: 50
			},
			async (err, svg) => {
				if (err) return reject(err);
				await fs.writeFile(outputPath, svg);
				console.log('✅ Outlines SVG saved to', outputPath);
				resolve();
			}
		);
	});
}

export async function saveRegionMasks(labelMap: number[][], outputDir: string) {
	const height = labelMap.length;
	const width = labelMap[0].length;
	const regionIds = Array.from(new Set(labelMap.flat()));

	await fs.mkdir(outputDir, { recursive: true });

	for (const regionId of regionIds) {
		const mask = new Uint8Array(width * height);
		let whitePixelCount = 0;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (labelMap[y][x] === regionId) {
					mask[y * width + x] = 255;
					whitePixelCount++;
				}
			}
		}

		if (whitePixelCount < 100) {
			console.log(`Skipping region ${regionId} (too small: ${whitePixelCount} pixels)`);
			continue;
		}

		const outputPath = path.join(outputDir, `region-${regionId}.png`);
		await sharp(mask, {
			raw: { width, height, channels: 1 }
		})
			.png()
			.toFile(outputPath);
		console.log(`Saved region ${regionId} mask to ${outputPath}`);
	}
}

export async function renderRegionsImage(labelMap: number[][], outputPath: string) {
	const height = labelMap.length;
	const width = labelMap[0].length;

	let numRegions = 0;
	for (const row of labelMap) {
		for (const val of row) {
			if (val > numRegions) numRegions = val;
		}
	}

	const colorPalette = Array.from({ length: numRegions + 1 }, (_, i) =>
		i === 0
			? [255, 255, 255]
			: [Math.random() * 255, Math.random() * 255, Math.random() * 255].map(Math.floor)
	);

	const buffer = Buffer.alloc(width * height * 3); // RGB

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const regionId = labelMap[y][x];
			const [r, g, b] = colorPalette[regionId];
			const idx = (y * width + x) * 3;
			buffer[idx] = r;
			buffer[idx + 1] = g;
			buffer[idx + 2] = b;
		}
	}

	await sharp(buffer, {
		raw: {
			width,
			height,
			channels: 3
		}
	}).toFile(outputPath);
}

export type LabelMap = number[][];

export function labelRegions(binary: number[][]): number[][] {
	const height = binary.length;
	const width = binary[0].length;
	const labels: number[][] = Array.from({ length: height }, () => Array(width).fill(0));
	let currentLabel = 1;

	const directions = [
		[0, 1],
		[1, 0],
		[0, -1],
		[-1, 0]
	];

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (binary[y][x] === 1 && labels[y][x] === 0) {
				// Start new region
				const queue = [[x, y]];
				labels[y][x] = currentLabel;

				while (queue.length > 0) {
					const [cx, cy] = queue.shift()!;
					for (const [dx, dy] of directions) {
						const nx = cx + dx;
						const ny = cy + dy;

						if (
							nx >= 0 &&
							nx < width &&
							ny >= 0 &&
							ny < height &&
							binary[ny][nx] === 1 &&
							labels[ny][nx] === 0
						) {
							labels[ny][nx] = currentLabel;
							queue.push([nx, ny]);
						}
					}
				}

				currentLabel++;
			}
		}
	}

	return labels;
}

export function toBinaryMatrix(data: Buffer, width: number, height: number): number[][] {
	const binary: number[][] = [];
	for (let y = 0; y < height; y++) {
		const row: number[] = [];
		for (let x = 0; x < width; x++) {
			const value = data[y * width + x];
			row.push(value === 255 ? 1 : 0); // 255 = white, 0 = black
		}
		binary.push(row);
	}
	return binary;
}

export async function computeRegionColors(
	imagePath: string,
	labelMap: number[][]
): Promise<Map<number, { r: number; g: number; b: number }>> {
	const sharp = (await import('sharp')).default;
	const { data, info } = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });

	const width = info.width;
	const height = info.height;

	const regionSums = new Map<number, { r: number; g: number; b: number; count: number }>();

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const region = labelMap[y][x];
			if (region === 0) continue; // background or unassigned

			const idx = (y * width + x) * 3;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];

			if (!regionSums.has(region)) {
				regionSums.set(region, { r: 0, g: 0, b: 0, count: 0 });
			}

			const sum = regionSums.get(region)!;
			sum.r += r;
			sum.g += g;
			sum.b += b;
			sum.count += 1;
		}
	}

	// Average per region
	const regionColors = new Map<number, { r: number; g: number; b: number }>();
	for (const [region, { r, g, b, count }] of regionSums.entries()) {
		regionColors.set(region, {
			r: Math.round(r / count),
			g: Math.round(g / count),
			b: Math.round(b / count)
		});
	}

	return regionColors;
}

export function generateMask(labelMap: number[][], regionId: number): Buffer {
	const height = labelMap.length;
	const width = labelMap[0].length;
	const mask = new Uint8Array(width * height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (labelMap[y][x] === regionId) {
				mask[y * width + x] = 255;
			}
		}
	}

	return Buffer.from(mask);
}

export function countWhitePixels(mask: Buffer): number {
	let count = 0;
	for (const value of mask) {
		if (value === 255) count++;
	}
	return count;
}

export async function computeRegionColor(
	imagePath: string,
	mask: Buffer
): Promise<{ r: number; g: number; b: number }> {
	const { data, info } = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });

	const width = info.width;
	const height = info.height;

	let rSum = 0;
	let gSum = 0;
	let bSum = 0;
	let count = 0;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = y * width + x;
			if (mask[idx] === 255) {
				const pixelIdx = idx * 3;
				rSum += data[pixelIdx];
				gSum += data[pixelIdx + 1];
				bSum += data[pixelIdx + 2];
				count++;
			}
		}
	}

	if (count === 0) return { r: 0, g: 0, b: 0 };

	return {
		r: Math.round(rSum / count),
		g: Math.round(gSum / count),
		b: Math.round(bSum / count)
	};
}
