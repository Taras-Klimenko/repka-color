import sys, os
import numpy as np
from skimage import io, segmentation, color, graph, filters, transform
from skimage.color import rgb2lab
from skimage.segmentation import find_boundaries, relabel_sequential
from collections import defaultdict
from scipy.ndimage import distance_transform_edt, center_of_mass
import json
import imageio

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
COMPACTNESS = 1           # Higher = more regular shapes, less edge-following
MERGE_THRESHOLD = 25      # Higher = more aggressive merging
MIN_REGION_SIZE = 500     # Remove regions smaller than this
RELABEL_REGIONS = True    # Whether to relabel regions sequentially
OUTPUT_DIR = "output"     # Output folder
THUMBNAIL_SIZE = 320      # Thumbnail size

def generate_thumbnail(image: np.ndarray, output_path: str, size: int = THUMBNAIL_SIZE):
    """Generate a thumbnail image with specified size"""
    print(f"Generating {size}x{size} thumbnail...")
    
    # Ensure image is in the correct format (uint8, 0-255 range)
    if image.dtype != np.uint8:
        if image.max() <= 1.0:
            # Image is in 0-1 range, scale to 0-255
            image = (image * 255).astype(np.uint8)
        else:
            # Image is in 0-255 range but wrong dtype
            image = image.astype(np.uint8)
    
    # Resize image to thumbnail size while maintaining aspect ratio
    # Use anti_aliasing=True for better quality
    thumbnail = transform.resize(
        image, 
        (size, size), 
        anti_aliasing=True,
        preserve_range=True
    )
    
    # Ensure thumbnail is in uint8 format
    if thumbnail.dtype != np.uint8:
        thumbnail = np.clip(thumbnail, 0, 255).astype(np.uint8)
    
    # Save as JPG using imageio
    imageio.imwrite(output_path, thumbnail, quality=85)
    print(f"Thumbnail saved to: {output_path}")

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
        start_label=0,
        enforce_connectivity=True,  # Ensures regions are connected
        convert2lab=True,  # Better color space for segmentation
        sigma=1  # Gaussian smoothing for better edge preservation
    )

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
    """Enhanced weight function that prevents large regions from swallowing smaller ones"""
    color_diff = g.nodes[dst]['mean color'] - g.nodes[n]['mean color']
    color_weight = np.linalg.norm(color_diff)
    
    # Get region sizes
    dst_size = g.nodes[dst]['pixel count']
    n_size = g.nodes[n]['pixel count']
    
    # Calculate size penalty - larger regions get penalized more
    # This prevents "swallowing" of smaller regions by large ones
    size_ratio = dst_size / max(n_size, 1)  # Avoid division by zero
    size_penalty = 0
    
    if size_ratio > 15:  # If destination is 5x larger than source
        size_penalty = 20 * (size_ratio - 5)  # Progressive penalty
    elif size_ratio > 30:  # If destination is 10x larger
        size_penalty = 50 * (size_ratio - 10)  # Even stronger penalty
    
    # Also penalize if the resulting region would be too large
    combined_size = dst_size + n_size
    if combined_size > 10000:  # Adjust this threshold based on your needs
        size_penalty += 30
    
    total_weight = color_weight + size_penalty
    
    # Add slight penalty for very different regions to preserve important boundaries
    if color_weight > 50:
        total_weight *= 1.2
    
    return {'weight': total_weight}


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


# Enhanced visual center computation with better edge handling
def compute_visual_centers_enhanced(label_map: np.ndarray, output_path: str):
    """Enhanced visual center computation with region size calculation for smart labels"""
    height, width = label_map.shape
    centers = {}
    region_sizes = {}
    
    unique_labels = np.unique(label_map)
    print(f"Computing visual centers and sizes for {len(unique_labels)} regions...")

    for label in unique_labels:
        if label == 0:
            continue

        mask = (label_map == label).astype(np.uint8)
        pixel_count = np.count_nonzero(mask)
        
        if pixel_count == 0:
            continue

        # Calculate region size (pixel count)
        region_sizes[int(label)] = pixel_count

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

    # Save both centers and sizes
    output_data = {
        'centers': centers,
        'sizes': region_sizes
    }
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"Visual centers and region sizes saved to {output_path}")
    print(f"Region size range: {min(region_sizes.values())} - {max(region_sizes.values())} pixels")


# Enhanced main segmentation pipeline
def segment_image_enhanced(
    input_path: str,
    output_dir: str = OUTPUT_DIR,
    segments: int = None,  # Now adaptive by default
    compactness: float = COMPACTNESS,
    merge_thresh: float = MERGE_THRESHOLD,
    min_region_size: int = MIN_REGION_SIZE,
    relabel: bool = RELABEL_REGIONS,
):
    """Enhanced segmentation pipeline with improved quality for coloring book generation"""
    print(f"Processing image: {input_path}")
    
    # Load and preprocess image
    image = io.imread(input_path)
    print(f"Image loaded: {image.shape}")

    # Generate thumbnail first
    thumbnail_path = os.path.join(output_dir, "thumbnail.jpg")
    generate_thumbnail(image, thumbnail_path, THUMBNAIL_SIZE)
    
    # Enhanced SLIC segmentation

    labels = slic_segment_enhanced(image, segments, compactness)
    
    print(f"Initial segmentation complete: {len(np.unique(labels))} regions")

    

    # Convert to LAB color space for better color-based merging
    image_lab = rgb2lab(image)
    rag = build_rag(image_lab, labels)

    # Enhanced hierarchical merging
    labels = graph.merge_hierarchical(
            labels, rag, thresh=merge_thresh,
            rag_copy=False, in_place_merge=True,
            merge_func=merge_func, 
            weight_func=weight_func_enhanced)
    
    print(f"After merging: {len(np.unique(labels))} regions")

    # Enhanced small region merging
    labels = merge_small_regions_enhanced(labels, image, min_region_size)

    
    print(f"After small region merging: {len(np.unique(labels))} regions")

    # Relabel regions sequentially if requested
    if relabel:
        labels, _, _ = relabel_sequential(labels)
        print(f"After relabeling: {len(np.unique(labels))} regions")
    
    labels = labels + 1

    # Generate output
    avg_color = color.label2rgb(labels, image, kind='avg')

    # Create output directory and save results
    os.makedirs(output_dir, exist_ok=True)
    np.save(f'{output_dir}/labels.npy', labels)
    io.imsave(f'{output_dir}/avg_colored.png', (avg_color * 255).astype(np.uint8))
    
    # Use enhanced visual center computation
    compute_visual_centers_enhanced(labels, f'{output_dir}/visual_centers.json')


    print(f' Enhanced segmentation complete!')
    print(f' Output saved to: {output_dir}')
    print(f' Generated {len(np.unique(labels))} coloring regions')

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
    segment_image_enhanced(input_path, output_dir)