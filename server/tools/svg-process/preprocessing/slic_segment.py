import sys, os
import numpy as np
from skimage import io, segmentation, color, graph, filters
from skimage.color import rgb2lab
from skimage.segmentation import find_boundaries, relabel_sequential
from collections import defaultdict
from scipy.ndimage import distance_transform_edt, center_of_mass
import json

# --- Enhanced Segmentation Settings ---
# Adaptive segmentation based on image size
def calculate_segments(image_shape):
    """Calculate optimal number of segments based on image size"""
    height, width = image_shape[:2]
    # Aim for segments roughly 50x50 pixels each for good detail
    target_segment_size = 50
    segments = (height * width) // (target_segment_size ** 2)
    # Keep within reasonable bounds for coloring book generation
    return max(8000, min(segments, 15000))

# Default settings (used when adaptive calculation isn't desired)
DEFAULT_SEGMENTS = 12000
COMPACTNESS = 10          # Higher = more regular shapes, less edge-following
MERGE_THRESHOLD = 20      # Higher = more aggressive merging
MIN_REGION_SIZE = 300     # Remove regions smaller than this
RELABEL_REGIONS = True    # Whether to relabel regions sequentially
OUTPUT_DIR = "output"     # Output folder

# Enhanced SLIC segmentation with edge-aware processing
def slic_segment_enhanced(image: np.ndarray, segments=None, compactness=COMPACTNESS) -> np.ndarray:
    """Enhanced SLIC segmentation with better boundary preservation"""
    if segments is None:
        segments = calculate_segments(image.shape)
    
    print(f"Using {segments} segments for image of size {image.shape[:2]}")
    
    # Use enhanced SLIC with better parameters for coloring book generation
    return segmentation.slic(
        image, 
        n_segments=segments, 
        compactness=compactness, 
        start_label=1,
        enforce_connectivity=True,  # Ensures regions are connected
        convert2lab=True,  # Better color space for segmentation
        sigma=1  # Gaussian smoothing for better edge preservation
    )

# Legacy function for backward compatibility
def slic_segment(image: np.ndarray, segments=DEFAULT_SEGMENTS, compactness=COMPACTNESS) -> np.ndarray:
    return segmentation.slic(image, n_segments=segments, compactness=compactness, start_label=1)

# Converts image to LAB color space and builds Region Adjacency Graph (RAG) for merging superpixels
def build_rag(image_lab: np.ndarray, labels: np.ndarray) -> graph.RAG:
    return graph.rag_mean_color(image_lab, labels)

# Enhanced merge function with better color averaging
def merge_func(g, src, dst):
    g.nodes[dst]['total color'] += g.nodes[src]['total color']
    g.nodes[dst]['pixel count'] += g.nodes[src]['pixel count']
    g.nodes[dst]['mean color'] = g.nodes[dst]['total color'] / g.nodes[dst]['pixel count']

# Enhanced weight function considering color similarity more intelligently
def weight_func_enhanced(g, src, dst, n):
    """Enhanced weight function for better region merging decisions"""
    color_diff = g.nodes[dst]['mean color'] - g.nodes[n]['mean color']
    color_weight = np.linalg.norm(color_diff)
    
    # Add slight penalty for very different regions to preserve important boundaries
    # This helps maintain distinct features in coloring books
    if color_weight > 50:  # High color difference threshold
        color_weight *= 1.2  # Increase weight to make merging less likely
    
    return {'weight': color_weight}

# Legacy weight function for backward compatibility
def weight_func(g, src, dst, n):
    diff = g.nodes[dst]['mean color'] - g.nodes[n]['mean color']
    return {'weight': np.linalg.norm(diff)}

# Enhanced small region merging with color similarity consideration
def merge_small_regions_enhanced(labels: np.ndarray, image: np.ndarray, min_size=MIN_REGION_SIZE) -> np.ndarray:
    """Enhanced small region merging considering color similarity"""
    label_sizes = dict(zip(*np.unique(labels, return_counts=True)))
    small_labels = [l for l, s in label_sizes.items() if s < min_size]
    
    if not small_labels:
        return labels
    
    # Calculate mean colors for each region (excluding background label 0)
    region_colors = {}
    for label in np.unique(labels):
        if label == 0:  # Skip background label
            continue
        mask = labels == label
        region_colors[label] = np.mean(image[mask], axis=0)
    
    # Build adjacency map
    label_adjacency = defaultdict(set)
    padded = np.pad(labels, 1, mode='edge')
    
    for y in range(1, padded.shape[0] - 1):
        for x in range(1, padded.shape[1] - 1):
            center = padded[y, x]
            neighbors = set(padded[y - 1:y + 2, x - 1:x + 2].flatten())
            neighbors.discard(center)
            label_adjacency[center].update(neighbors)
    
    # Merge small regions based on color similarity and boundary length
    for label in small_labels:
        mask = labels == label
        large_neighbors = [n for n in label_adjacency[label] if n not in small_labels and n != 0]
        if not large_neighbors:
            continue
        
        # Find best neighbor based on color similarity and boundary length
        best_neighbor = None
        best_score = float('inf')
        
        for neighbor in large_neighbors:
            # Skip if neighbor is not in our color dictionary (shouldn't happen, but safety check)
            if neighbor not in region_colors or label not in region_colors:
                continue
                
            boundary_length = np.sum((labels == neighbor) & find_boundaries(mask, connectivity=1))
            if boundary_length == 0:
                continue
                
            color_diff = np.linalg.norm(region_colors[label] - region_colors[neighbor])
            
            # Score based on boundary length and color similarity
            # Lower score = better match
            score = color_diff / (boundary_length + 1)  # Avoid division by zero
            
            if score < best_score:
                best_score = score
                best_neighbor = neighbor
        
        if best_neighbor is not None:
            labels[mask] = best_neighbor
    
    return labels

# Legacy function for backward compatibility
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

# Enhanced visual center computation with better edge handling
def compute_visual_centers_enhanced(label_map: np.ndarray, output_path: str):
    """Enhanced visual center computation with better edge handling"""
    height, width = label_map.shape
    centers = {}
    
    print(f"Computing visual centers for {len(np.unique(label_map)) - 1} regions...")

    for label in np.unique(label_map):
        if label == 0:
            continue

        mask = (label_map == label).astype(np.uint8)
        if np.count_nonzero(mask) == 0:
            continue

        # Use distance transform to find the most central point
        distance = distance_transform_edt(mask)
        y, x = np.unravel_index(np.argmax(distance), distance.shape)

        # Enhanced edge detection - use larger margin for better center placement
        margin = 10  # Increased margin for better center placement
        if (
            x <= margin or x >= width - margin or
            y <= margin or y >= height - margin
        ):
            # Too close to edge, use weighted center of mass
            weighted_distance = distance * mask
            cy, cx = center_of_mass(weighted_distance)
            x, y = int(cx), int(cy)
            
            # Ensure coordinates are within bounds
            x = max(0, min(x, width - 1))
            y = max(0, min(y, height - 1))

        centers[int(label)] = [int(x), int(y)]

    with open(output_path, 'w') as f:
        json.dump(centers, f, indent=2)
    
    print(f"Visual centers saved to {output_path}")

# Legacy function for backward compatibility
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

# Enhanced main segmentation pipeline
def segment_image_enhanced(
    input_path: str,
    output_dir: str = OUTPUT_DIR,
    segments: int = None,  # Now adaptive by default
    compactness: float = COMPACTNESS,
    merge_thresh: float = MERGE_THRESHOLD,
    min_region_size: int = MIN_REGION_SIZE,
    relabel: bool = RELABEL_REGIONS,
    use_enhanced: bool = True  # New parameter to control enhancement level
):
    """Enhanced segmentation pipeline with improved quality for coloring book generation"""
    print(f"Processing image: {input_path}")
    
    # Load and preprocess image
    image = io.imread(input_path)
    print(f"Image loaded: {image.shape}")
    
    # Enhanced SLIC segmentation
    if use_enhanced:
        labels = slic_segment_enhanced(image, segments, compactness)
    else:
        labels = slic_segment(image, segments or DEFAULT_SEGMENTS, compactness)
    
    print(f"Initial segmentation complete: {len(np.unique(labels))} regions")

    # Convert to LAB color space for better color-based merging
    image_lab = rgb2lab(image)
    rag = build_rag(image_lab, labels)

    # Enhanced hierarchical merging
    if use_enhanced:
        labels = graph.merge_hierarchical(
            labels, rag, thresh=merge_thresh,
            rag_copy=False, in_place_merge=True,
            merge_func=merge_func, 
            weight_func=weight_func_enhanced
        )
    else:
        labels = graph.merge_hierarchical(
            labels, rag, thresh=merge_thresh,
            rag_copy=False, in_place_merge=True,
            merge_func=merge_func, 
            weight_func=weight_func
        )
    
    print(f"After merging: {len(np.unique(labels))} regions")

    # Enhanced small region merging
    if use_enhanced:
        labels = merge_small_regions_enhanced(labels, image, min_region_size)
    else:
        labels = merge_small_regions(labels, min_region_size)
    
    print(f"After small region merging: {len(np.unique(labels))} regions")

    # Relabel regions sequentially if requested
    if relabel:
        labels, _, _ = relabel_sequential(labels)
        print(f"After relabeling: {len(np.unique(labels))} regions")

    # Generate output
    avg_color = color.label2rgb(labels, image, kind='avg')

    # Create output directory and save results
    os.makedirs(output_dir, exist_ok=True)
    np.save(f'{output_dir}/labels.npy', labels)
    io.imsave(f'{output_dir}/avg_colored.png', (avg_color * 255).astype(np.uint8))
    
    # Use enhanced visual center computation
    if use_enhanced:
        compute_visual_centers_enhanced(labels, f'{output_dir}/visual_centers.json')
    else:
        compute_visual_centers(labels, f'{output_dir}/visual_centers.json')

    print(f' Enhanced segmentation complete!')
    print(f' Output saved to: {output_dir}')
    print(f' Generated {len(np.unique(labels)) - 1} coloring regions')

# Legacy function for backward compatibility
def segment_image(
    input_path: str,
    output_dir: str = OUTPUT_DIR,
    segments: int = DEFAULT_SEGMENTS,
    compactness: float = COMPACTNESS,
    merge_thresh: float = MERGE_THRESHOLD,
    min_region_size: int = MIN_REGION_SIZE,
    relabel: bool = RELABEL_REGIONS
):
    """Legacy segmentation function for backward compatibility"""
    return segment_image_enhanced(
        input_path, output_dir, segments, compactness, 
        merge_thresh, min_region_size, relabel, use_enhanced=False
    )

# Command Line Interface Entrypoint
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python slic_segment.py <input_image_path> [output_dir] [use_enhanced]")
        print("  use_enhanced: 1 for enhanced mode (default), 0 for legacy mode")
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_DIR
    use_enhanced = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    
    print(f"Starting {'enhanced' if use_enhanced else 'legacy'} segmentation...")
    segment_image_enhanced(input_path, output_dir, use_enhanced=bool(use_enhanced))