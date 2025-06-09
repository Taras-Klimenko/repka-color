import sys, os
import numpy as np
from skimage import io, segmentation, color, graph
from skimage.color import rgb2lab
from skimage.segmentation import find_boundaries, relabel_sequential
from collections import defaultdict
from scipy.ndimage import distance_transform_edt, center_of_mass
import json

# --- Segmentation Settings ---
SEGMENTS = 12000          # Higher = more superpixels
COMPACTNESS = 10          # Higher = more regular shapes, less edge-following
MERGE_THRESHOLD = 20      # Higher = more aggressive merging
MIN_REGION_SIZE = 300     # Remove regions smaller than this
RELABEL_REGIONS = True    # Whether to relabel regions sequentially
OUTPUT_DIR = "output"     # Output folder

# Initial picture segmentation into superpixels, uses Simple Iterative Linear Clusterization (SLIC)
def slic_segment(image: np.ndarray, segments=SEGMENTS, compactness=COMPACTNESS) -> np.ndarray:
    return segmentation.slic(image, n_segments=segments, compactness=compactness, start_label=1)

# Converts image to LAB color space and builds Region Adjancency Graph (RAG) for merging superpixels
def build_rag(image_lab: np.ndarray, labels: np.ndarray) -> graph.RAG:
    return graph.rag_mean_color(image_lab, labels)


# Custom functions for determining RAG weights and merging regions
def merge_func(g, src, dst):
    g.nodes[dst]['total color'] += g.nodes[src]['total color']
    g.nodes[dst]['pixel count'] += g.nodes[src]['pixel count']
    g.nodes[dst]['mean color'] = g.nodes[dst]['total color'] / g.nodes[dst]['pixel count']

def weight_func(g, src, dst, n):
    diff = g.nodes[dst]['mean color'] - g.nodes[n]['mean color']
    return {'weight': np.linalg.norm(diff)}

#  Function to identify and merge small regions into best suitable neighbouring regions
def merge_small_regions(labels: np.ndarray, min_size=MIN_REGION_SIZE) -> np.ndarray:
    label_sizes = dict(zip(*np.unique(labels, return_counts=True)))
    small_labels = [l for l, s in label_sizes.items() if s < min_size]

    label_adjacency = defaultdict(set)
    padded = np.pad(labels, 1, mode='edge')

    for y in range(1, padded.shape[0] - 1):
        for x in range(1, padded.shape[1] - 1):
            center = padded[y, x]
            neighbors = set(padded[y - 1:y + 2, x - 1:x + 2].flatten())
            neighbors.discard(center)
            label_adjacency[center].update(neighbors)

    for label in small_labels:
        mask = labels == label
        large_neighbors = [n for n in label_adjacency[label] if n not in small_labels]
        if not large_neighbors:
            continue

        neighbor_counts = {
            n: np.sum((labels == n) & find_boundaries(mask, connectivity=1))
            for n in large_neighbors
        }

        if neighbor_counts:
            best = max(neighbor_counts, key=neighbor_counts.get)
            labels[mask] = best

    return labels


# Compute visual centers of each region and save to JSON
def compute_visual_centers(label_map: np.ndarray, output_path: str):
    height, width = label_map.shape
    centers = {}

    for label in np.unique(label_map):
        if label == 0:
            continue

        mask = (label_map == label).astype(np.uint8)
        if np.count_nonzero(mask) == 0:
            continue

        distance = distance_transform_edt(mask)
        y, x = np.unravel_index(np.argmax(distance), distance.shape)

        # Check how close to the edge the computed center is
        margin = 5  # pixels
        if (
            x <= margin or x >= width - margin or
            y <= margin or y >= height - margin
        ):
            # Too close to edge, fallback to geometric center
            weighted_distance = distance * mask
            cy, cx = center_of_mass(weighted_distance)
            x, y = int(cx), int(cy)

        centers[int(label)] = [int(x), int(y)]

    with open(output_path, 'w') as f:
        json.dump(centers, f, indent=2)

# Main segmentation pipeline to break image into segments and save output preview and labels map
def segment_image(
    input_path: str,
    output_dir: str = OUTPUT_DIR,
    segments: int = SEGMENTS,
    compactness: float = COMPACTNESS,
    merge_thresh: float = MERGE_THRESHOLD,
    min_region_size: int = MIN_REGION_SIZE,
    relabel: bool = RELABEL_REGIONS
):
    image = io.imread(input_path)
    labels = slic_segment(image, segments, compactness)

    image_lab = rgb2lab(image)
    rag = build_rag(image_lab, labels)

    labels = graph.merge_hierarchical(
        labels, rag, thresh=merge_thresh,
        rag_copy=False, in_place_merge=True,
        merge_func=merge_func, weight_func=weight_func
    )

    labels = merge_small_regions(labels, min_region_size)

    if relabel:
        labels, _, _ = relabel_sequential(labels)

    avg_color = color.label2rgb(labels, image, kind='avg')

    os.makedirs(output_dir, exist_ok=True)
    np.save(f'{output_dir}/labels.npy', labels)
    io.imsave(f'{output_dir}/avg_colored.png', (avg_color * 255).astype(np.uint8))
    compute_visual_centers(labels, f'{output_dir}/visual_centers.json')

    print(f'Done. Output saved to: {output_dir}')



# Command Line Interface Entrypoint
if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    segment_image(sys.argv[1])