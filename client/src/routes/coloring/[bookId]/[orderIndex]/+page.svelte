<script lang="ts">
	import PictureCanvas from '$lib/components/PictureCanvas.svelte';
	import ColorPalette from '$lib/components/ColorPalette.svelte';
	import DescriptionBar from '$lib/components/DescriptionBar.svelte';
	import Menu from '$lib/components/Menu.svelte';
	// import svg from '../../../../../../server/output/final.svg?raw';
	// import rawColors from '../../../../../../server/output/colors.json';
	import { tick, onMount } from 'svelte';
	import { page } from '$app/state';
	import type { Color } from '$lib/types';
	import { AssetLoader, type PageAssets } from '$lib/entities/assetLoader';
	import '$lib/app.css';

	const { bookId, orderIndex } = page.params;

	let pageAssets = $state<PageAssets | null>(null);
	let colors = $state<Color[]>([]);
	let selectedColorId = $state<number | null>(null);
	let isPaletteAnimating = $state(false);
	let removingColorId = $state<number | null>(null);
	let hasDescriptionBar = $state(true);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		const abortController = new AbortController();
		// Reset state when bookId or orderIndex changes
		loading = true;
		error = null;
		pageAssets = null;
		colors = [];
		selectedColorId = null;

		async function loadPageAssets() {
			try {
				if (abortController.signal.aborted) return;

				const assets = await AssetLoader.loadPageAssets(parseInt(bookId), parseInt(orderIndex));

				if (abortController.signal.aborted) return;

				pageAssets = assets;
				colors = assets.loadedData.colors;
			} catch (err) {
				if (!abortController.signal.aborted) {
					console.error('Failed to load page assets:', err);
				}
			} finally {
				if (!abortController.signal.aborted) {
					loading = false;
				}
			}}

			loadPageAssets();

			return () => {
				abortController.abort();
			};
		}
	);

	function handleSelect(colorId: number) {
		selectedColorId = colorId;
	}

	async function removeColor(colorId: number | null) {
		if (colorId === null) return;

		const index = colors.findIndex((c) => c.id === colorId);
		if (index === -1) return;

		removingColorId = colorId;
		await tick(); // await for DOM update
		await new Promise((r) => setTimeout(r, 300)); // await for out animation

		isPaletteAnimating = true;

		colors.splice(index, 1);
		colors = [...colors]; // trigger reactivity

		// Auto-select next color (if any)
		if (colors.length > 0) {
			const nextIndex = index < colors.length ? index : colors.length - 1;
			selectedColorId = colors[nextIndex].id;
		} else {
			selectedColorId = null;
		}

		await tick(); // allow palette slide animation to start
		await new Promise((r) => setTimeout(r, 300)); // wait for it to finish

		isPaletteAnimating = false;
		removingColorId = null;
	}
</script>

{#if loading}
	<div class="loading-container">
		<Menu />
		<main class="loading-content">
			<p>Loading coloring page...</p>
		</main>
	</div>
{:else if error}
	<div class="error-container">
		<Menu />
		<main class="error-content">
			<h1>Oops! Something went wrong</h1>
			<p>{error}</p>
			<button on:click={() => window.location.reload()}>Try Again</button>
		</main>
	</div>
{:else if pageAssets && pageAssets.loadedData && pageAssets.loadedData.svg}
	<div class="app">
		<Menu />
		<main>
			<div class="main-page__layout">
				<div class="main-area__layout">
					<div class="canvas">
						<PictureCanvas
							svg={pageAssets.loadedData.svg}
							selectedColor={colors.find((color) => color.id === selectedColorId) || null}
							onCorrectColorClick={() => removeColor(selectedColorId)}
							originalImageUrl={pageAssets.assets.originalImage}
						/>
					</div>
				</div>
				<div class="floating-palette {hasDescriptionBar ? 'with-description' : 'no-description'}">
					<ColorPalette
						{colors}
						{selectedColorId}
						onSelect={handleSelect}
						isAnimating={isPaletteAnimating}
						{removingColorId}
					/>
				</div>
				<DescriptionBar
					text={pageAssets.page.description || ''}
					audioSrc={pageAssets.assets.audio}
				/>
			</div>
		</main>
	</div>
{/if}

<style>
	.main-page__layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
	}

	.main-area__layout {
		flex: 1 1 auto;
		display: flex;
		flex-direction: row;
		min-height: 0;
	}

	.canvas {
		flex: 1;
		min-height: 0;
	}

	.floating-palette {
		position: fixed;
		top: 12vh;
		right: 0;
		height: 75vh;
		width: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		padding: 1rem;
	}

	@media (orientation: portrait) {
		.floating-palette {
			left: 0;
			right: 0;
			top: auto;
			width: 100vw;
			height: auto;
			padding: 0;
			background: rgba(255, 255, 255, 0.15);
			backdrop-filter: blur(8px);
		}

		.floating-palette.with-description {
			bottom: calc(10vh + 16px);
		}

		.floating-palette.no-description {
			bottom: 16px;
		}
	}

	@media (max-height: 600px) and (orientation: landscape) {
		.floating-palette {
			top: 8vh;
		}
	}
</style>
