import fs from 'fs/promises';
import path from 'path';
import { trace } from 'potrace';

const masksDir = path.resolve('src/lib/assets/processed/region-masks');
const svgDir = path.resolve('src/lib/assets/processed/svgs');

async function vectorizeMasks() {
	await fs.mkdir(svgDir, { recursive: true });
	const files = await fs.readdir(masksDir);

	for (const file of files) {
		if (!file.endsWith('.png')) continue;

		const inputPath = path.join(masksDir, file);
		const outputPath = path.join(svgDir, file.replace('.png', '.svg'));

		await new Promise<void>((resolve, reject) => {
			trace(
				inputPath,
				{
					threshold: 128,
					background: 'transparent',
					turdSize: 10,
					optCurve: true,
					optTolerance: 0.4
				},
				async (err, svg) => {
					if (err) return reject(err);
					await fs.writeFile(outputPath, svg);
					console.log(`✅ Vectorized: ${file}`);
					resolve();
				}
			);
		});
	}
}

vectorizeMasks().catch(console.error);
