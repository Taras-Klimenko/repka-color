import fs from "fs/promises";
import path from "path";
import { parse } from "svgson";
import { create } from "xmlbuilder2";

type Color = { id: number; hex: string };

const svgsDir = path.resolve("output/processed/svgs");
const regionColorsPath = path.resolve("output/processed/region-colors.json");
const visualCentersPath = path.resolve("output/visual_centers.json");
const outlinesPath = path.resolve("output/processed/outlines.svg");
const outputPath = path.resolve("output/regions.svg");

const LABEL_CONFIG = {
  minFontSize: 6,
  maxFontSize: 14,
  minRegionSize: 100,
  maxRegionSize: 10000,
  minStrokeWidth: 0.2,
  maxStrokeWidth: 1,
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

function calculateStrokeWidth(regionSize: number): number {
  const normalizedSize = Math.max(
    0,
    Math.min(
      1,
      (regionSize - LABEL_CONFIG.minRegionSize) /
        (LABEL_CONFIG.maxRegionSize - LABEL_CONFIG.minRegionSize)
    )
  );

  const strokeWidth =
    LABEL_CONFIG.minStrokeWidth +
    (LABEL_CONFIG.maxStrokeWidth - LABEL_CONFIG.minStrokeWidth) *
      normalizedSize;

  return Math.round(strokeWidth * 10) / 10; // Round to 1 decimal place
}

function getLabelSizeClass(regionSize: number): string {
  if (regionSize < 500) {
    return "region-label-xsmall";
  }
  if (regionSize < 1000) {
    return "region-label-small";
  }
  if (regionSize < 4000) {
    return "region-label-medium";
  }
  if (regionSize < 8000) {
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
  const maskRegions: any[] = [];

  const visualData = JSON.parse(await fs.readFile(visualCentersPath, "utf-8"));

  let visualCenters: Record<string, [number, number]> = visualData.centers;
  let regionSizes: Record<string, number> = visualData.sizes;

  // for (const [index, file] of files.entries()) {
  //   if (!file.endsWith(".svg")) continue;

  //   const match = file.match(/region-(\d+)\.svg/);
  //   if (!match) continue;

  //   const regionId = match[1];
  //   const colorId = index + 1;

  //   const svgPath = path.join(svgsDir, file);
  //   const svgContent = await fs.readFile(svgPath, "utf-8");

  //   const parsed = await parse(svgContent);
  //   const pathElement = parsed.children.find((c) => c.name === "path");

  //   if (!pathElement) continue;
  //   const fillRule = pathElement.attributes["fill-rule"] || "evenodd";

  //   const color = regionColors[regionId];
  //   if (!color) continue;

  //   const hexColor = rgbToHex(color.r, color.g, color.b);

  //   const strokeWidth = calculateStrokeWidth(regionSizes[regionId]);

  //   allPaths.push({
  //     name: "path",
  //     attributes: {
  //       d: pathElement.attributes.d,
  //       fill: "whitesmoke",
  //       "fill-rule": fillRule,
  //       "data-region": regionId,
  //       "data-color-id": colorId,
  //       stroke: "grey",
  //       "stroke-width": strokeWidth.toString(),
  //       class: "color-region",
  //     },
  //   });

  //   maskRegions.push({
  //     regionId,
  //     pathData: pathElement.attributes.d,
  //     fillRule,
  //   });

  //   colorIdMap.push({ id: colorId, hex: hexColor });
  // }

  // const outlinesContent = await fs.readFile(outlinesPath, "utf-8");
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

  // Build the final SVG
  const root = create({ version: "1.0" }).ele("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 1024 1024",
  });

  const defs = root.ele("defs");
  const mask = defs.ele("mask", { id: "outline-mask" });

  mask.ele("rect", {
    width: 1024,
    height: 1024,
    fill: "black",
  });

  const viewportGroup = root.ele("g", { id: "viewport" });

  for (const [index, file] of files.entries()) {
    if (!file.endsWith(".svg")) {
      continue;
    }
    const match = file.match(/region-(\d+)\.svg/);
    if (!match) {
      continue;
    }

    const regionId = match[1];
    const colorId = index + 1;

    const svgPath = path.join(svgsDir, file);
    const svgContent = await fs.readFile(svgPath, "utf-8");
    const parsed = await parse(svgContent);
    const pathElement = parsed.children.find((c) => c.name === "path");

    if (!pathElement) {
      continue;
    }

    const fillRule = pathElement.attributes["fill-rule"] || "evenodd";
    const color = regionColors[regionId];

    if (!color) {
      continue;
    }

    const hexColor = rgbToHex(color.r, color.g, color.b);
    const strokeWidth = calculateStrokeWidth(regionSizes[regionId]);

    const regionPathId = `region-path-${colorId}`;

    viewportGroup.ele("path", {
      d: pathElement.attributes.d,
      fill: "whitesmoke",
      "fill-rule": fillRule,
      "data-region": regionId,
      "data-color-id": colorId,
      stroke: "grey",
      "stroke-width": strokeWidth.toString(),
      class: "color-region",
    });

    mask.ele("path", {
      d: pathElement.attributes.d,
      fill: "white",
      "fill-rule": fillRule,
      class: `mask-region mask-region-${regionId}`,
      "data-region": regionId,
    });

    colorIdMap.push({ id: colorId, hex: hexColor });
  }

  // for (const maskRegion of maskRegions) {
  //   mask.ele("path", {
  //     d: maskRegion.pathData,
  //     fill: "black",
  //     "fill-rule": maskRegion.fillRule,
  //     class: `mask-region mask-region-${maskRegion.regionId}`,
  //     "data-region": maskRegion.regionId,
  //   });
  // }

  const outlinesContent = await fs.readFile(outlinesPath, "utf-8");
  const parsedOutlines = await parse(outlinesContent);

  for (const child of parsedOutlines.children) {
    if (child.name !== "path") continue;
    viewportGroup.ele("path", {
      ...child.attributes,
      fill: "black",
      class: "outlines-layer",
      mask: "url(#outline-mask)",
      "pointer-events": "none",
    });
  }

  // for (const pathObj of allPaths) {
  //   viewportGroup.ele(pathObj.name, pathObj.attributes);
  // }

  for (const [regionId, [x, y]] of Object.entries(visualCenters)) {
    const colorId = colorIdMap.find((c) => c.id === parseInt(regionId))?.id;
    const fontSize = calculateFontSize(regionSizes[regionId]);
    const labelSizeClass = getLabelSizeClass(regionSizes[regionId]);
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
