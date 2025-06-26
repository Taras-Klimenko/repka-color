<script lang="ts">
	import confetti from 'canvas-confetti';
	import { onMount } from 'svelte';
	import type { Color } from '$lib/types';

	const {
		svg,
		originalImageUrl,
		selectedColor,
		onCorrectColorClick = () => {}
	} = $props<{
		svg: string;
		originalImageUrl: string;
		selectedColor: Color | null;
		onCorrectColorClick: () => void;
	}>();

	// === creating DOM refs ===
	let allPaths: NodeListOf<SVGPathElement>;
	let regionLabels: NodeListOf<SVGTextElement>;
	let svgEl: SVGSVGElement;
	let viewGroup: SVGGElement;

	// Progress tracking
	let hasFinished = $state(false);
	let isTimelapsing = $state(false);
	let totalRegions = $state(0);
	let filledRegions = $state(0);
	let progressPercentage = $derived(
		totalRegions === 0 ? 0 : Math.floor((filledRegions / totalRegions) * 100)
	);

	// === setting up zoom and pan state ===

	let scale = $state(1);
	let translate = $state({ x: 0, y: 0 });
	let isPanning = $state(false);
	let last = $state({ x: 0, y: 0 });

	function updateTransform() {
		requestAnimationFrame(() => {
			if (viewGroup) {
				viewGroup.setAttribute(
					'transform',
					`translate(${translate.x},${translate.y}) scale(${scale})`
				);
			}
		});
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

	let animationFrame: number | null = null;

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
		event.preventDefault();
		const zoomFactor = 1.1;
		const delta = event.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

		// Get bounding rect to find relative mouse position
		const rect = svgEl.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		// Adjust translate so zoom centers around cursor
		translate.x -= (mouseX - translate.x) * (delta - 1);
		translate.y -= (mouseY - translate.y) * (delta - 1);

		scale *= delta;
		updateTransform();
	}

	function handlePointerClick(target: SVGElement) {
		if (!target.dataset.colorId || !(target instanceof SVGElement)) return;
		if (!selectedColor || target.dataset.colorId !== String(selectedColor.id)) return;

		target.classList.add('fade-out');
		target.classList.remove('highlight');

		regionLabels.forEach((textEl) => {
			if (textEl.textContent === target.dataset.colorId) {
				textEl.remove();
			}
		});
		filledRegions += 1;
		onCorrectColorClick();
	}
	onMount(() => {
		allPaths = svgEl.querySelectorAll('path[data-color-id]');
		regionLabels = svgEl.querySelectorAll('text.region-label');
		totalRegions = allPaths.length;
	});

	$effect(() => {
		allPaths.forEach((el) => {
			const elColorId = el.getAttribute('data-color-id');
			if (!elColorId) return;

			const isHighlighted = el.classList.contains('highlight');
			const shouldHighlight = selectedColor && elColorId === String(selectedColor.id);

			if (shouldHighlight && !isHighlighted) {
				el.classList.add('highlight');
			} else if (!shouldHighlight && isHighlighted) {
				el.classList.remove('highlight');
			}
		});

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
	<div class="progress-bar-wrapper">
		<div class="progress-bar">
			<div class="progress-bar-fill" style="width: {progressPercentage}%;"></div>
		</div>
		<p class="progress-text">{progressPercentage} %</p>
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
		display: flex;
		flex-direction: column;
	}

	.svg-container {
		background-color: whitesmoke;
		width: 80%;
		height: auto;
		max-height: 80vh;
		border: 1px solid #ccc;
		cursor: grab;
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

	.progress-bar-wrapper {
		width: 80%;
		margin: 1rem auto;
		text-align: center;
	}

	.progress-bar {
		width: 100%;
		height: 20px;
		background-color: #eee;
		border-radius: 10px;
		overflow: hidden;
		box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
	}

	.progress-bar-fill {
		height: 100%;
		background-color: #4caf50;
		width: 0%;
		transition: width 0.3s ease;
	}

	.progress-text {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #333;
	}

	:global(.color-region.timelapse-start) {
		opacity: 1;
	}

	:global(.color-region.timelapse-reveal) {
		opacity: 0;
	}
</style>
