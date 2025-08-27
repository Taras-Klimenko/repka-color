<script lang="ts">
	import confetti from 'canvas-confetti';
	import { onDestroy, onMount } from 'svelte';
	import type { Color } from '$lib/types';

	const {
		svg,
		originalImageUrl,
		selectedColor,
		onCorrectColorClick = () => {},
		progressPercentage = 0,
		usedColorsIds = []
	} = $props<{
		svg: string;
		originalImageUrl: string;
		selectedColor: Color | null;
		onCorrectColorClick: () => void;
		progressPercentage: number;
		usedColorsIds?: number[];
	}>();

	// === performance optimization ===

	let animationFrame: number | null = null;
	let touchThrottleTimer: number | null = null;
	let lastTransformUpdate = 0;
	const TRANSFORM_THROTTLE_MS = 24;

	// === creating DOM refs ===
	let allPaths: NodeListOf<SVGPathElement>;
	let regionLabels: NodeListOf<SVGTextElement>;
	let maskRegions: NodeListOf<SVGPathElement>;
	let svgEl: SVGSVGElement;
	let viewGroup: SVGGElement;
	let colorIdToPathMap: Map<string, SVGPathElement>;
	let colorIdToLabelMap: Map<string, SVGTextElement>;
	let colorIdToMaskMap: Map<string, SVGPathElement>;

	// Progress tracking
	let hasFinished = $state(false);
	let isTimelapsing = $state(false);
	let previousHighlightedElement: SVGPathElement | null = null;

	// === setting up zoom and pan state ===

	let scale = $state(1);
	let translate = $state({ x: 0, y: 0 });
	let isPanning = $state(false);
	let last = $state({ x: 0, y: 0 });

	// === setting up touch zoom state ===

	let initialDistance = $state(0);
	let initialScale = $state(1);
	let isZooming = $state(false);

	let activePointers = new Map<number, { x: number; y: number }>();
	let lastCenter = { x: 0, y: 0 };
	let downPosition = { x: 0, y: 0 };
	let downTime = 0;

	function getPointerDistance() {
		const pointers = Array.from(activePointers.values());
		if (pointers.length < 2) {
			return 0;
		}
		const dx = pointers[0].x - pointers[1].x;
		const dy = pointers[0].y - pointers[1].y;
		return Math.hypot(dx, dy);
	}

	function getPointerCenter() {
		const pointers = Array.from(activePointers.values());

		if (pointers.length < 2) {
			return { x: 0, y: 0 };
		}

		return { x: (pointers[0].x + pointers[1].x) / 2, y: (pointers[0].y + pointers[1].y) / 2 };
	}

	function updateTransform() {
		const now = performance.now();

		if (now - lastTransformUpdate < TRANSFORM_THROTTLE_MS) {
			return;
		}

		lastTransformUpdate = now;

		if (svgEl) {
			svgEl.style.transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`;
		}
	}

	function updateLabelVisibility() {
		if (!svgEl) {
			return;
		}
		svgEl.classList.remove('zoom-xsmall', 'zoom-small', 'zoom-medium', 'zoom-large', 'zoom-xlarge');

		let visibleLabels: string[] = [];

		if (scale >= 3) {
			svgEl.classList.add('zoom-xlarge');
			visibleLabels = ['xsmall', 'small', 'medium', 'large', 'xlarge'];
		} else if (scale >= 2.5) {
			svgEl.classList.add('zoom-large');
			visibleLabels = ['small', 'medium', 'large', 'xlarge'];
		} else if (scale >= 2) {
			svgEl.classList.add('zoom-medium');
			visibleLabels = ['medium', 'large', 'xlarge'];
		} else if (scale >= 1.5) {
			svgEl.classList.add('zoom-small');
			visibleLabels = ['large', 'xlarge'];
		} else {
			svgEl.classList.add('zoom-xsmall');
			visibleLabels = ['xlarge'];
		}

		regionLabels.forEach((label) => {
			const labelSize = label.classList.contains('region-label-xlarge')
				? 'xlarge'
				: label.classList.contains('region-label-large')
					? 'large'
					: label.classList.contains('region-label-medium')
						? 'medium'
						: label.classList.contains('region-label-small')
							? 'small'
							: label.classList.contains('region-label-xsmall')
								? 'xsmall'
								: null;
			label.style.display = labelSize && visibleLabels.includes(labelSize) ? 'block' : 'none';
		});
	}

	// === mouse and touch pan events ===
	function handlePointerDown(event: PointerEvent) {
		if (isTimelapsing) {
			return;
		}

		downPosition = { x: event.clientX, y: event.clientY };
		downTime = Date.now();

		if (event.pointerType === 'touch') {
			activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

			if (activePointers.size === 2) {
				isZooming = true;
				isPanning = false;
				initialDistance = getPointerDistance();
				initialScale = scale;
				lastCenter = getPointerCenter();
			} else {
				isPanning = true;
				last = { x: event.clientX, y: event.clientY };
			}
		} else {
			isPanning = true;
			last = { x: event.clientX, y: event.clientY };
		}

		svgEl.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (isTimelapsing) {
			return;
		}

		if (event.pointerType === 'touch') {
			if (activePointers.has(event.pointerId)) {
				activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
			}
			if (isZooming && activePointers.size >= 2) {
				const center = getPointerCenter();

				const centerDx = center.x - lastCenter.x;
				const centerDy = center.y - lastCenter.y;
				if (Math.abs(centerDx) < 0.5 && Math.abs(centerDy) < 0.5) {
					return;
				}

				// Panning while pinching

				translate.x += centerDx;
				translate.y += centerDy;
				lastCenter = center;

				const newScale = (getPointerDistance() / initialDistance) * initialScale;
				const clampedScale = Math.max(0.7, Math.min(3.5, newScale));
				const k = clampedScale / scale; //scale change factor

				translate.x = (1 - k) * center.x + k * translate.x;
				translate.y = (1 - k) * center.y + k * translate.y;

				scale = clampedScale;

				updateTransform();
				updateLabelVisibility();
				return;
			}
		}
		if (isPanning && !animationFrame) {
			const dx = event.clientX - last.x;
			const dy = event.clientY - last.y;
			if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
				return;
			}
			animationFrame = requestAnimationFrame(() => {
				last = { x: event.clientX, y: event.clientY };

				translate.x += dx;
				translate.y += dy;
				updateTransform();
				animationFrame = null;
			});
		}
	}

	function handlePointerUp(event: PointerEvent) {
		if (event.pointerType === 'touch') {
			activePointers.delete(event.pointerId);
		}

		if (activePointers.size < 2) {
			isZooming = false;
		}

		const duration = Date.now() - downTime;
		const dx = Math.abs(event.clientX - downPosition.x);
		const dy = Math.abs(event.clientY - downPosition.y);

		isPanning = false;
		svgEl.releasePointerCapture(event.pointerId);

		if (dx < 5 && dy < 5 && duration < 300 && !isZooming) {
			const target = document.elementFromPoint(event.clientX, event.clientY) as SVGElement;
			const colorRegion = target?.closest('[data-color-id]') as SVGElement;
			if (colorRegion) {
				handlePointerClick(colorRegion);
			}
		}
		initialDistance = 0;
	}

	function handleWheel(event: WheelEvent) {
		if (isTimelapsing) {
			return;
		}
		const zoomFactor = 1.1;
		const delta = event.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

		const newScale = scale * delta;

		if (newScale >= 0.7 && newScale <= 3.5) {
			scale = newScale;
			updateTransform();
			updateLabelVisibility();
		}
	}

	function handlePointerClick(target: SVGElement) {
		if (!target.dataset.colorId || !(target instanceof SVGElement)) return;
		if (!selectedColor || target.dataset.colorId !== String(selectedColor.id)) return;

		target.classList.add('fade-out');
		target.classList.remove('highlight');

		const label = colorIdToLabelMap.get(target.dataset.colorId);
		if (label) {
			label.remove();
			colorIdToLabelMap.delete(target.dataset.colorId);
		}

		const maskRegion = colorIdToMaskMap.get(target.dataset.colorId);
		if (maskRegion) {
			maskRegion.remove();
			colorIdToMaskMap.delete(target.dataset.colorId);
		}

		onCorrectColorClick();
	}

	onMount(() => {
		svgEl.addEventListener('wheel', handleWheel, { passive: true });
		svgEl.addEventListener('pointerdown', handlePointerDown, { passive: false });
		svgEl.addEventListener('pointermove', handlePointerMove, { passive: true });
		svgEl.addEventListener('pointerup', handlePointerUp, { passive: true });
		svgEl.addEventListener('pointerleave', handlePointerUp, { passive: true });

		allPaths = svgEl.querySelectorAll('path[data-color-id]');
		regionLabels = svgEl.querySelectorAll('text.region-label');
		maskRegions = svgEl.querySelectorAll('.mask-region');

		colorIdToPathMap = new Map();
		allPaths.forEach((el) => {
			if (el.dataset.colorId) {
				colorIdToPathMap.set(el.dataset.colorId, el);
			}
		});

		colorIdToLabelMap = new Map();
		regionLabels.forEach((el) => {
			if (el.textContent) {
				colorIdToLabelMap.set(el.textContent, el);
			}
		});

		colorIdToMaskMap = new Map();
		maskRegions.forEach((el) => {
			if (el.dataset.region) {
				colorIdToMaskMap.set(el.dataset.region, el);
			}
		});

		updateLabelVisibility();
		applyUsedColors();
	});

	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
		if (touchThrottleTimer) {
			clearTimeout(touchThrottleTimer);
			touchThrottleTimer = null;
		}
		svgEl.removeEventListener('wheel', handleWheel);
		svgEl.removeEventListener('pointerdown', handlePointerDown);
		svgEl.removeEventListener('pointermove', handlePointerMove);
		svgEl.removeEventListener('pointerup', handlePointerUp);
		svgEl.removeEventListener('pointerleave', handlePointerUp);

		activePointers.clear();
		colorIdToPathMap.clear();
		colorIdToLabelMap.clear();
		colorIdToMaskMap.clear();
	});

	function applyUsedColors() {
		if (usedColorsIds.length === 0) {
			return;
		}
		allPaths.forEach((path) => {
			const colorId = path.dataset.colorId;

			if (colorId && usedColorsIds.includes(Number(colorId))) {
				path.classList.add('fade-out');

				const label = colorIdToLabelMap.get(colorId);
				if (label) {
					label.remove();
					colorIdToLabelMap.delete(colorId);
				}

				const maskRegion = document.querySelector(`.mask-region-${colorId}`);
				if (maskRegion) {
					maskRegion.remove();
				}
			}
		});
	}

	$effect(() => {
		const newId = selectedColor ? String(selectedColor.id) : null;
		let newHighlightedElement: SVGPathElement | null = null;

		if (previousHighlightedElement) {
			previousHighlightedElement.classList.remove('highlight');
			previousHighlightedElement = null;
		}

		if (newId) {
			newHighlightedElement = colorIdToPathMap.get(newId) || null;
			if (newHighlightedElement) {
				newHighlightedElement.classList.add('highlight');
				previousHighlightedElement = newHighlightedElement;
			}
		}

		if (progressPercentage === 100 && !hasFinished) {
			hasFinished = true;
			confetti({
				particleCount: 150,
				spread: 70,
				origin: { y: 0.6 }
			});

			isTimelapsing = true;
			allPaths.forEach((el) => el.classList.replace('fade-out', 'timelapse-start'));

			scale = 1;
			translate = { x: 0, y: 0 };
			updateTransform();

			allPaths.forEach((el, i) => {
				setTimeout(() => {
					el.classList.add('timelapse-reveal');
				}, i * 100); // 100ms delay between each
			});
		}
	});
</script>

<!-- TODO: resolve accessibility issue -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="component-container">
	<svg bind:this={svgEl} viewBox="0 0 1024 1024" class="svg-container">
		<g bind:this={viewGroup}>
			<image
				href={originalImageUrl}
				x="0"
				y="0"
				width="1024"
				height="1024"
				preserveAspectRatio="xMidYMid meet"
			/>
			{@html svg}
		</g>
	</svg>
	<div class="progress-bar-overlay">
		<div class="progress-bar">
			<div class="progress-bar-fill" style="width: {progressPercentage}%;"></div>
			<p class="progress-text">{progressPercentage} %</p>
		</div>
	</div>
</div>

<style>
	@keyframes fillPulse {
		0% {
			fill: gray;
		}
		50% {
			fill: white;
		}
		100% {
			fill: gray;
		}
	}

	.component-container {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
		background-color: whitesmoke;
	}

	.svg-container {
		background-color: whitesmoke;
		width: 100%;
		height: 100%;
		display: block;
		cursor: grab;
		flex: 1;
		touch-action: none;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}

	:global(.color-region) {
		cursor: pointer;
		transition: opacity 0.5s ease;
		vector-effect: non-scaling-stroke;
		shape-rendering: optimizeSpeed;
	}

	:global(.mask-region) {
		vector-effect: non-scaling-stroke;
		shape-rendering: optimizeSpeed;
		stroke-opacity: 0;
		transition: none;
		pointer-events: none;
	}

	:global(.color-region.highlight) {
		animation: fillPulse 2.5s infinite;
	}

	:global(.color-region.fade-out) {
		opacity: 0;
		pointer-events: none;
	}

	.svg-container,
	.svg-container * {
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-webkit-user-drag: none;
	}

	.progress-bar-overlay {
		position: absolute;
		width: 100%;
		bottom: 0;
		left: 50%;
		transform: translate(-50%);
		text-align: center;
		background-color: rgba(255, 255, 255, 0.6);
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}

	.progress-bar {
		width: 100%;
		height: 16px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background-color: #4caf50;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.9rem;
		font-weight: 600;
		color: #333;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	:global(.region-label) {
		pointer-events: none;
		fill: #1e293b;
		stroke: white;
		stroke-linejoin: round;
		stroke-linecap: round;
		paint-order: stroke fill;
		display: none;
		vector-effect: non-scaling-stroke;
		shape-rendering: optimizeSpeed;
	}

	:global(.timelapse-start) {
		opacity: 1;
	}

	:global(.timelapse-reveal) {
		opacity: 0;
	}
</style>
