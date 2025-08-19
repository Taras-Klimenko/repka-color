<script lang="ts">
	import confetti from 'canvas-confetti';
	import { onMount } from 'svelte';
	import type { Color } from '$lib/types';
	import { isTouchDevice } from '$lib/utils/isTouchDevice';

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
	const TRANSFORM_THROTTLE_MS = 16;



	// === creating DOM refs ===
	let allPaths: NodeListOf<SVGPathElement>;
	let regionLabels: NodeListOf<SVGTextElement>;
	let svgEl: SVGSVGElement;
	let viewGroup: SVGGElement;
	let colorIdToPathMap: Map<string, SVGPathElement>;
	let colorIdToLabelMap: Map<string, SVGTextElement>;

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
	let touchStartTime = $state(0);

	function getDistance(touches: TouchList): number {
		if (touches.length < 2) {
			return 0;
		}

		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;

		return Math.sqrt(dx * dx + dy * dy);
	}

	function handleTouchStart(event: TouchEvent) {
		if (isTimelapsing) {
			return;
		}

		touchStartTime = Date.now();

		if (event.touches.length === 1) {
			isPanning = true;
			last = { x: event.touches[0].clientX, y: event.touches[0].clientY };
		} else if (event.touches.length === 2) {
			isZooming = true;
			isPanning = false;
			initialDistance = getDistance(event.touches);
			initialScale = scale;
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (isTimelapsing) {
			return;
		}

		event.preventDefault();

		if (event.touches.length === 1 && isPanning) {
			if (!animationFrame) {
				animationFrame = requestAnimationFrame(() => {
					const dx = event.touches[0].clientX - last.x;
					const dy = event.touches[0].clientY - last.y;

					last = { x: event.touches[0].clientX, y: event.touches[0].clientY };

					translate.x += dx;
					translate.y += dy;
					updateTransform();
					animationFrame = null;
				});
			}
		} else if (event.touches.length === 2 && isZooming) {
			const currentDistance = getDistance(event.touches);

			if (initialDistance > 0) {
				const newScale = (currentDistance / initialDistance) * initialScale;
				const clampedScale = Math.max(0.7, Math.min(3.5, newScale));

				if (clampedScale !== scale) {
					scale = clampedScale;
					updateTransform();
					updateLabelVisibility();
				}
			}
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		if (isTimelapsing) {
			return;
		}

		const touchEndTime = Date.now();
		const touchDuration = touchEndTime - touchStartTime;

		if (event.touches.length === 0 && touchDuration < 300 && !isZooming) {
			const target = document.elementFromPoint(last.x, last.y) as SVGElement;

			if (target) {
				handlePointerClick(target);
			}
		}
		isPanning = false;
		isZooming = false;
		initialDistance = 0;
	}

	function updateTransform() {
		if (svgEl) {
			svgEl.style.transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`;
		}
	}

	function updateLabelVisibility() {
		if (!svgEl) {
			return;
		}
		svgEl.classList.remove('zoom-xsmall', 'zoom-small', 'zoom-medium', 'zoom-large', 'zoom-xlarge');

		if (scale >= 3) {
			svgEl.classList.add('zoom-xlarge');
		} else if (scale >= 2.5) {
			svgEl.classList.add('zoom-large');
		} else if (scale >= 2) {
			svgEl.classList.add('zoom-medium');
		} else if (scale >= 1.5) {
			svgEl.classList.add('zoom-small');
		} else {
			svgEl.classList.add('zoom-xsmall');
		}
	}

	// === mouse pan events ===
	function handlePointerDown(event: PointerEvent) {
		if (isTimelapsing) {
			return;
		}
		isPanning = true;
		last = { x: event.clientX, y: event.clientY };
		svgEl.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isPanning || animationFrame) return;

		animationFrame = requestAnimationFrame(() => {
			const dx = event.clientX - last.x;
			const dy = event.clientY - last.y;
			last = { x: event.clientX, y: event.clientY };
			translate.x += dx;
			translate.y += dy;
			updateTransform();
			animationFrame = null;
		});
	}

	function handlePointerUp(event: PointerEvent) {
		isPanning = false;
		svgEl.releasePointerCapture(event.pointerId);

		const dx = Math.abs(event.clientX - last.x);
		const dy = Math.abs(event.clientY - last.y);
		if (dx < 5 && dy < 5) {
			const target = document.elementFromPoint(event.clientX, event.clientY) as SVGElement;
			handlePointerClick(target);
		}
	}

	function handleWheel(event: WheelEvent) {
		if (isTimelapsing) {
			return;
		}
		event.preventDefault();
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

		const maskRegion = document.querySelector(`.mask-region-${target.dataset.colorId}`);

		if (maskRegion) {
			maskRegion.classList.add('colored');
		}

		onCorrectColorClick();
	}

	onMount(() => {
		allPaths = svgEl.querySelectorAll('path[data-color-id]');
		regionLabels = svgEl.querySelectorAll('text.region-label');

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
		updateLabelVisibility();
		applyUsedColors();
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
					maskRegion.classList.add('colored');
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
			allPaths.forEach((el) => el.classList.add('timelapse-start'));

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
	<svg
		bind:this={svgEl}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerUp}
		onwheel={handleWheel}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		viewBox="0 0 1024 1024"
		class="svg-container"
	>
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
	:global(.mask-region) {
		opacity: 0;
	}

	:global(.mask-region.colored) {
		opacity: 1;
	}

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
	}

	:global(.color-region.highlight) {
		animation: fillPulse 2.5s infinite;
	}

	:global(.color-region.fade-out) {
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.5s ease;
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
		transition: opacity 0.3s ease;
		pointer-events: none;
		opacity: 0;
		fill: #1e293b;
		stroke: white;
		stroke-linejoin: round;
		stroke-linecap: round;
		paint-order: stroke fill;
	}

	:global(.svg-container.zoom-xsmall .region-label-xlarge) {
		opacity: 1;
	}

	/* Small zoom - show large+ labels */
	:global(.svg-container.zoom-small .region-label-large),
	:global(.svg-container.zoom-small .region-label-xlarge) {
		opacity: 1;
	}

	/* Medium zoom - show medium+ labels */
	:global(.svg-container.zoom-medium .region-label-medium),
	:global(.svg-container.zoom-medium .region-label-large),
	:global(.svg-container.zoom-medium .region-label-xlarge) {
		opacity: 1;
	}

	/* Large zoom - show small+ labels */
	:global(.svg-container.zoom-large .region-label-small),
	:global(.svg-container.zoom-large .region-label-medium),
	:global(.svg-container.zoom-large .region-label-large),
	:global(.svg-container.zoom-large .region-label-xlarge) {
		opacity: 1;
	}

	/* Extra large zoom - show all labels */
	:global(.svg-container.zoom-xlarge .region-label-xsmall),
	:global(.svg-container.zoom-xlarge .region-label-small),
	:global(.svg-container.zoom-xlarge .region-label-medium),
	:global(.svg-container.zoom-xlarge .region-label-large),
	:global(.svg-container.zoom-xlarge .region-label-xlarge) {
		opacity: 1;
	}

	:global(.color-region.timelapse-start) {
		opacity: 1;
	}

	:global(.color-region.timelapse-reveal) {
		opacity: 0;
	}
</style>
