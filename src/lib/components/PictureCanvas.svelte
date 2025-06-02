<script lang="ts">
	import { onMount, afterUpdate, tick } from 'svelte';
	import type { Color } from '$lib/types';

	export let svg: string = '';
	export let selectedColor: Color | null = null;

	let container: HTMLDivElement;

	function handleClick(event: MouseEvent) {
		const target = event.target as SVGElement;

		if (!(target instanceof SVGElement) || !target.dataset.colorId) {
			return;
		}
		if (!selectedColor || target.dataset.colorId !== String(selectedColor.id)) {
			return;
		}

		const colorId = target.dataset.colorId;
		// Set initial fill (gray or current fill) to ensure transition works
		const currentFill = getComputedStyle(target).fill;
		target.style.fill = currentFill;

		// Ensure highlight is removed to stop pulsing
		target.classList.remove('highlight');

		// Use requestAnimationFrame to trigger fill transition
		requestAnimationFrame(() => {
			target.style.fill = selectedColor.hex;
		});

		const svgEl = container.querySelector('svg');
		if (!svgEl) return;

		const textElements = svgEl.querySelectorAll('text.region-label');
		textElements.forEach((textEl) => {
			if (textEl.textContent === colorId) {
				textEl.remove();
			}
		});
	}

	onMount(() => {
		container.addEventListener('click', handleClick);

		const svgEl = container.querySelector('svg');
		if (!svgEl) return;

		const ns = 'http://www.w3.org/2000/svg';

		const paths = svgEl.querySelectorAll('[data-color-id]');
		paths.forEach((pathEl) => {
			const colorId = pathEl.getAttribute('data-color-id');
			if (!colorId) return;

			// Use getBBox to get bounding box
			const bbox = (pathEl as SVGGraphicsElement).getBBox();

			const text = document.createElementNS(ns, 'text');
			text.setAttribute('x', String(bbox.x + bbox.width / 2));
			text.setAttribute('y', String(bbox.y + bbox.height / 2));
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('dominant-baseline', 'middle');
			text.setAttribute('font-size', '10');
			text.setAttribute('fill', 'black');
			text.setAttribute('pointer-events', 'none'); // allow clicks to pass through
			text.textContent = colorId;
			text.classList.add('region-label');

			svgEl.appendChild(text);
			(pathEl as SVGElement).classList.add('color-region');
		});
	});

	afterUpdate(async () => {
		await tick(); // wait for DOM update
		const paths = container.querySelectorAll('path[data-color-id]');

		paths.forEach((el) => {
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

<div class="picture-canvas" bind:this={container}>
	{@html svg}
</div>

<style>
	@keyframes fillPulse {
		0% {
			fill: gray;
			opacity: 0.6;
		}
		50% {
			fill: white;
			opacity: 0.6;
		}
		100% {
			fill: gray;
			opacity: 0.6;
		}
	}

	.picture-canvas {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}
	:global(.picture-canvas svg) {
		width: 100%;
		max-width: 700px;
		height: auto;
		display: block;
		margin: 0 auto;
	}
	:global(.picture-canvas text) {
		user-select: none;
	}

	:global(.color-region) {
		transition: fill 0.5s ease;
		cursor: pointer;
	}

	:global(.color-region.highlight) {
		animation: fillPulse 2.5s infinite;
	}
</style>
