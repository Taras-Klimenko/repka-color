import fs from "fs/promises";
import path from "path";
import { parse } from "svgson";
import { create } from "xmlbuilder2";
import type { Color } from "../../../client/src/lib/types";

const svgsDir = path.resolve("output/processed/svgs");
const regionColorsPath = path.resolve("output/processed/region-colors.json");
const visualCentersPath = path.resolve("output/visual_centers.json");
const outlinesPath = path.resolve("output/processed/outlines.svg");
const outputPath = path.resolve("output/regions.svg");

const LABEL_CONFIG = {
  minFontSize: 6,
  maxFontSize: 14,
  minRegionSize: 500,
  maxRegionSize: 50000,
};

function calculateFontSize(regionSize: number): number {
  const normalizedSize = Math.max(
    0,
    Math.min(
      1,
      (regionSize - LABEL_CONFIG.minRegionSize) /
        (LABEL_CONFIG.maxRegionSize - LABEL_CONFIG.minRegionSize)
    )
  );

  const fontSize =
    LABEL_CONFIG.minFontSize +
    (LABEL_CONFIG.maxFontSize - LABEL_CONFIG.minFontSize) * normalizedSize;

  return Math.round(fontSize);
}

function getLabelSizeClass(regionSize: number): string {
  if (regionSize < 500) {
    return "region-label-xsmall";
  }
  if (regionSize < 1000) {
    return "region-label-small";
  }
  if (regionSize < 3000) {
    return "region-label-medium";
  }
  if (regionSize < 10000) {
    return "region-label-large";
  }
  return "region-label-xlarge";
}

async function composeFinalSVG() {
  const regionColors = JSON.parse(await fs.readFile(regionColorsPath, "utf-8"));
  const files = await fs.readdir(svgsDir);
  files.sort((a, b) => {
    const aId = parseInt(a.match(/region-(\d+)\.svg/)?.[1] ?? "0", 10);
    const bId = parseInt(b.match(/region-(\d+)\.svg/)?.[1] ?? "0", 10);
    return aId - bId;
  });

  const allPaths: any[] = [];
  const colorIdMap: Color[] = [];

  for (const [index, file] of files.entries()) {
    if (!file.endsWith(".svg")) continue;

    const match = file.match(/region-(\d+)\.svg/);
    if (!match) continue;

    const regionId = match[1];
    const colorId = index + 1;

    const svgPath = path.join(svgsDir, file);
    const svgContent = await fs.readFile(svgPath, "utf-8");

    const parsed = await parse(svgContent);
    const pathElement = parsed.children.find((c) => c.name === "path");

    if (!pathElement) continue;
    const fillRule = pathElement.attributes["fill-rule"] || "evenodd";

    const color = regionColors[regionId];
    if (!color) continue;

    const hexColor = rgbToHex(color.r, color.g, color.b);

    allPaths.push({
      name: "path",
      attributes: {
        d: pathElement.attributes.d,
        fill: "whitesmoke",
        "fill-rule": fillRule,
        "data-region": regionId,
        "data-color-id": colorId,
        stroke: "grey",
        "stroke-width": "0.3",
        class: "color-region",
      },
    });
    colorIdMap.push({ id: colorId, hex: hexColor });
  }

  const outlinesContent = await fs.readFile(outlinesPath, "utf-8");
  // const parsedOutline = await parse(outlinesContent);

  // for (const child of parsedOutline.children) {
  // 	if (child.name !== 'path') continue;
  // 	allPaths.push({
  // 		name: 'path',
  // 		attributes: {
  // 			...child.attributes,
  // 			fill: 'none',
  // 			stroke: 'grey',
  // 			'stroke-width': '0.5',
  // 			'fill-rule': 'evenodd',
  // 			'pointer-events': 'none'
  // 		}
  // 	});
  // }

  const visualData = JSON.parse(await fs.readFile(visualCentersPath, "utf-8"));

  let visualCenters: Record<string, [number, number]> = visualData.centers;
  let regionSizes: Record<string, number> = visualData.sizes;

  // Build the final SVG
  const root = create({ version: "1.0" }).ele("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 1024 1024",
  });

  const viewportGroup = root.ele("g", { id: "viewport" });

  for (const pathObj of allPaths) {
    viewportGroup.ele(pathObj.name, pathObj.attributes);
  }

  for (const [regionId, [x, y]] of Object.entries(visualCenters)) {
    const colorId = colorIdMap.find((c) => c.id === parseInt(regionId))?.id;
    const fontSize = calculateFontSize(regionSizes[regionId]);
    const labelSizeClass = getLabelSizeClass(regionSizes[regionId])
    if (!colorId) continue;

    viewportGroup
      .ele("text", {
        x: x.toFixed(2),
        y: y.toFixed(2),
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        "font-size": fontSize.toString(),
        fill: "black",
        "pointer-events": "none",
        class: `region-label ${labelSizeClass}`,
      })
      .txt(colorId.toString());
  }

  const svg = root.end({ prettyPrint: true });

  await fs.writeFile(outputPath, svg);
  console.log("✅ Final SVG composed!");
  await fs.writeFile(
    path.resolve("output/colors.json"),
    JSON.stringify(colorIdMap, null, 2)
  );
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

composeFinalSVG().catch(console.error);
