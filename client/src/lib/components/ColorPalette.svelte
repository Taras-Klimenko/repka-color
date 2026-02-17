<script lang="ts">
	import type { Color } from '$lib/types';
	import { flip } from 'svelte/animate';
	import { onDestroy, onMount } from 'svelte';

	const { colors, selectedColorId, onSelect, isAnimating, removingColorId } = $props<{
		colors: Color[];
		selectedColorId: number | null;
		onSelect: (colorId: number) => void;
		isAnimating: boolean;
		removingColorId: number | null;
	}>();

	let container: HTMLDivElement;
	let scrollTop = $state(0);
	let scrollLeft = $state(0);
	let containerHeight = $state(0);
	let containerWidth = $state(0);
	let isPortrait = $state(false);

	// Virtualization settings
	let itemHeight = $state(50); // Approximate height of each color well + gap (landscape)
	let itemWidth = $state(50); // Approximate width of each color well + gap (portrait)
	const overscan = 5; // Number of items to render outside viewport

	const updateItemSize = () => {
		if (window.matchMedia('(orientation: portrait) and (max-width: 600px)').matches) {
			itemWidth = window.innerWidth * 0.119; // 11vw
		} else if (window.matchMedia('(orientation: portrait)').matches) {
			itemWidth = window.innerWidth * 0.089; // 8vw
		} else if (window.matchMedia('(max-height: 600px) and (orientation: landscape)').matches) {
			itemHeight = window.innerHeight * 0.099; // 9vh
		} else {
			itemHeight = window.innerHeight * 0.069; // 6vh
		}
	};

	// Calculate visible range based on scroll position and orientation
	const visibleRange = $derived.by(() => {
		if (isPortrait) {
			// Horizontal scrolling in portrait
			if (!containerWidth) return { start: 0, end: Math.min(colors.length, 20) };

			const start = Math.max(0, Math.floor(scrollLeft / itemWidth) - overscan);
			const visibleCount = Math.ceil(containerWidth / itemWidth) + overscan * 2;
			const end = Math.min(colors.length, start + visibleCount);

			return { start, end };
		} else {
			// Vertical scrolling in landscape
			if (!containerHeight) return { start: 0, end: Math.min(colors.length, 20) };

			const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
			const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
			const end = Math.min(colors.length, start + visibleCount);

			return { start, end };
		}
	});

	// Get visible colors
	const visibleColors = $derived(colors.slice(visibleRange.start, visibleRange.end));

	// Calculate padding for scroll position
	const paddingTop = $derived(isPortrait ? 0 : visibleRange.start * itemHeight);
	const paddingBottom = $derived(isPortrait ? 0 : (colors.length - visibleRange.end) * itemHeight);
	const paddingLeft = $derived(isPortrait ? visibleRange.start * itemWidth : 0);
	const paddingRight = $derived(isPortrait ? (colors.length - visibleRange.end) * itemWidth : 0);

	function handleScroll() {
		if (!container) return;
		scrollTop = container.scrollTop;
		scrollLeft = container.scrollLeft;
	}

	function checkOrientation() {
		isPortrait = window.innerHeight > window.innerWidth;
		updateItemSize();
	}

	onMount(() => {
		checkOrientation();
		window.addEventListener('resize', checkOrientation);
		window.addEventListener('orientationchange', checkOrientation);

		if (container) {
			container.addEventListener('scroll', handleScroll, { passive: true });
			containerHeight = container.clientHeight;
			containerWidth = container.clientWidth;
		}
	});

	onDestroy(() => {
		window.removeEventListener('resize', checkOrientation);
		window.removeEventListener('orientationchange', checkOrientation);
		if (container) {
			container.removeEventListener('scroll', handleScroll);
		}
	});
</script>

<div class="color-palette-container">
	<div bind:this={container} class="color-palette {isAnimating ? 'no-snap' : ''}">
		<div
			class="virtual-content"
			style="
				padding-top: {paddingTop}px; 
				padding-bottom: {paddingBottom}px;
				padding-left: {paddingLeft}px;
				padding-right: {paddingRight}px;
			"
		>
			{#each visibleColors as color (color.id)}
				<button
					class="color-well {selectedColorId === color.id ? 'selected' : ''} {color.id ===
					removingColorId
						? 'removing'
						: ''}"
					style="background-color: {color.hex};"
					onclick={() => onSelect(color.id)}
					animate:flip={{ duration: 300}}
				>
					<span class="color-id">{color.id}</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.color-palette-container {
		padding: clamp(0.5rem, 1vw, 1.5rem);
		width: clamp(55px, 7vw, 120px);
		margin-right: 1vw;
		box-sizing: content-box;
		height: 62vh;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		border-radius: 32px;
		position: relative;
	}

	.color-palette {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		justify-content: flex-start;
		overflow-y: auto;
		gap: 0.9vh;
		max-height: 100%;
		scroll-snap-type: y proximity;
		scroll-snap-align: start;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.virtual-content {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		gap: 0.9vh;
		width: 100%;
	}

	.color-palette::-webkit-scrollbar {
		display: none;
	}

	.color-well {
		width: 6vh;
		height: 6vh;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		scroll-snap-align: start;
		transition:
			transform 0.2s ease-in-out,
			opacity 0.2s ease-in-out;
		scale: 1;
	}

	/* Scale out animation for removing elements */
	.color-well.removing {
		transform: scale(0.1);
		opacity: 0;
		pointer-events: none;
	}

	.color-well.selected {
		border-color: #000;
	}
	.color-well.selected::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 2px solid #fff;
		pointer-events: none;
	}

	.color-id {
		color: white;
		text-shadow: 0 0 2px #000;
		font-size: clamp(0.7rem, 2vh, 1.3rem);
	}

	.color-palette.no-snap {
		scroll-snap-type: none;
	}

	@media (orientation: portrait) {
		.color-palette-container {
			width: 97vw;
			height: 9vw;
			padding: 0.5rem 0.5rem 0.5rem 0.5rem;
			border-radius: 0;
			margin: 0;
		}

		.color-palette {
			flex-direction: row;
			overflow-x: auto;
			overflow-y: hidden;
			max-width: 100vw;
			max-height: none;
			scroll-snap-type: x proximity;
			flex-wrap: nowrap;
			gap: 0.9vw;
		}

		.virtual-content {
			flex-direction: row;
			flex-wrap: nowrap;
			gap: 0.9vw;
		}

		.color-well {
			flex: 0 0 auto;
			width: 8vw;
			height: 8vw;
		}

		.color-id {
			font-size: clamp(0.8rem, 2vw, 1.3rem);
		}

		@media (max-width: 600px) and (orientation: portrait) {
			.color-palette-container {
				width: 95vw;
				height: 11vw;
			}

			.color-well {
				width: 11vw;
				height: 11vw;
			}
		}
	}
	@media (max-height: 600px) and (orientation: landscape) {
		.color-palette-container {
			height: 69vh;
		}

		.color-well {
			width: 9vh;
			height: 9vh;
		}
	}
</style>
