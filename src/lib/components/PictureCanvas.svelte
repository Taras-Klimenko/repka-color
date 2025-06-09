<script lang="ts">
	import { onMount, afterUpdate, tick } from 'svelte';
	import type { Color } from '$lib/types';

	export let svg: string = '';
	export let originalImageUrl: string = '';
	export let selectedColor: Color | null = null;
	export let onCorrectColorClick: () => void = () => {};

	let allPaths: NodeListOf<SVGPathElement>;

	// === setting up zoom and pan state ===
	let svgEl: SVGSVGElement;
	let viewGroup: SVGGElement;

	let scale = 1;
	let translate = { x: 0, y: 0 };
	let isPanning = false;
	let last = { x: 0, y: 0 };

	function updateTransform() {
		if (viewGroup) {
			viewGroup.setAttribute(
				'transform',
				`translate(${translate.x},${translate.y}) scale(${scale})`
			);
		}
	}

	// === mouse pan events ===
	function handleMouseDown(event: MouseEvent) {
		isPanning = true;
		last = { x: event.clientX, y: event.clientY };
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isPanning) return;
		const dx = event.clientX - last.x;
		const dy = event.clientY - last.y;
		last = { x: event.clientX, y: event.clientY };
		translate.x += dx;
		translate.y += dy;
		updateTransform();
	}

	function handleMouseUp() {
		isPanning = false;
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

	function handleClick(event: MouseEvent) {
		const target = event.target as SVGElement;
		if (!target.dataset.colorId || !(target instanceof SVGElement)) return;
		if (!selectedColor || target.dataset.colorId !== String(selectedColor.id)) return;

		target.style.transition = 'opacity 0.5s ease';
		target.style.opacity = '0';
		target.classList.remove('highlight');

		const textElements = svgEl.querySelectorAll('text.region-label');
		textElements.forEach((textEl) => {
			if (textEl.textContent === target.dataset.colorId) {
				textEl.remove();
			}
		});
		onCorrectColorClick();
	}

	onMount(() => {
		allPaths = svgEl.querySelectorAll('path[data-color-id]');
		allPaths.forEach((pathEl) => {
			const colorId = pathEl.getAttribute('data-color-id');
			if (!colorId) return;
			pathEl.style.stroke = 'grey';
			pathEl.style.strokeWidth = '0.2';
			pathEl.classList.add('color-region');
		});
	});

	afterUpdate(() => {
		allPaths.forEach((el) => {
			const elColorId = el.getAttribute('data-color-id');
			if (!elColorId) return;
			if (selectedColor && elColorId === String(selectedColor.id)) {
				el.classList.add('highlight');
			} else {
				el.classList.remove('highlight');
			}
		});
	});
</script>

<svg
	bind:this={svgEl}
	on:click={handleClick}
	on:mousedown={handleMouseDown}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:mouseleave={handleMouseUp}
	on:wheel={handleWheel}
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

	.svg-container {
		background-color: ivory;
		width: 80%;
		height: auto;
		max-height: 80vh;
		border: 1px solid #ccc;
		touch-action: none;
		cursor: grab;
	}

	:global(.color-region) {
		will-change: fill;
		transition: fill 0.5s ease;
		cursor: pointer;
	}

	:global(.color-region.highlight) {
		animation: fillPulse 2.5s infinite;
	}
</style>
