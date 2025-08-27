<script lang="ts">
	import PictureCanvas from '$lib/components/PictureCanvas.svelte';
	import ColorPalette from '$lib/components/ColorPalette.svelte';
	import DescriptionBar from '$lib/components/DescriptionBar.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import { tick, onMount } from 'svelte';
	import { page } from '$app/state';
	import type { Color } from '$lib/types';
	import { AssetLoader, type PageAssets } from '$lib/entities/assetLoader';
	import { userProgressStore } from '$lib/stores/userProgressState';
	import { user } from '$lib/stores/userState';
	import '$lib/app.css';

	const { bookId, orderIndex } = page.params;

	let canvasResetKey = $state(0);

	let pageAssets = $state<PageAssets | null>(null);
	let colors = $state<Color[]>([]);
	let selectedColorId = $state<number | null>(null);
	let isPaletteAnimating = $state(false);
	let removingColorId = $state<number | null>(null);
	let hasDescriptionBar = $derived(!!pageAssets?.page.description);
	let originalColorsLength = $derived(pageAssets?.loadedData.colors.length || 0);
	let currentColorsLength = $derived(colors.length);
	let progressPercentage = $derived(
		Math.floor(((originalColorsLength - currentColorsLength) / originalColorsLength) * 100)
	);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let usedColorsIds = $derived.by(() => {
		if (!pageAssets?.loadedData.colors) {
			return [];
		}
		return pageAssets.loadedData.colors
			.filter((color) => !colors.some((c) => c.id === color.id))
			.map((color) => color.id);
	});

	async function loadExistingProgress() {
		if (!pageAssets?.page.id) {
			return;
		}

		try {
			const existingProgress = await userProgressStore.loadPageProgress(pageAssets.page.id);
			if (existingProgress?.currentColors) {
				colors = existingProgress.currentColors;
			}
		} catch (err) {
			console.error('Failed to load existing progress:', err);
		}
	}

	async function resetPage() {
		if (!pageAssets) {
			return;
		}

		colors = [...pageAssets.loadedData.colors];
		selectedColorId = null;
		isPaletteAnimating = false;
		canvasResetKey++;

		userProgressStore.clearRestartFlag(pageAssets.page.id);
	}

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

				if (userProgressStore.isPageMarkedForRestart(assets.page.id)) {
					await resetPage();
				} else {
					await loadExistingProgress();
				}
			} catch (err) {
				if (!abortController.signal.aborted) {
					console.error('Failed to load page assets:', err);
				}
			} finally {
				if (!abortController.signal.aborted) {
					loading = false;
				}
			}
		}

		loadPageAssets();

		const handleRestart = (event: CustomEvent) => {
			if (event.detail.pageId === pageAssets?.page.id) {
				resetPage();
			}
		};

		window.addEventListener('restart-page', handleRestart as EventListener);

		return () => {
			abortController.abort();
			window.removeEventListener('restart-page', handleRestart as EventListener);
		};
	});

	function handleSelect(colorId: number) {
		selectedColorId = colorId;
	}

	function removeColor(colorId: number | null) {
		if (colorId === null) return;

		const index = colors.findIndex((c) => c.id === colorId);
		if (index === -1) return;

		// Set animation state
		removingColorId = colorId;
		isPaletteAnimating = true;

		// Single timeout chain for better performance
		setTimeout(() => {
			// Update colors array
			colors.splice(index, 1);

			// Auto-select next color
			if (colors.length > 0) {
				const nextIndex = index < colors.length ? index : colors.length - 1;
				selectedColorId = colors[nextIndex].id;
			} else {
				selectedColorId = null;
			}

			// Let Svelte handle the DOM update naturally
			setTimeout(() => {
				isPaletteAnimating = false;
				removingColorId = null;
			}, 300);
		}, 300);

		// Save progress in background (don't block UI)
		if (pageAssets?.page.id && $user?.id !== -1) {
			userProgressStore
				.updatePageProgress(pageAssets.page.id, progressPercentage, colors)
				.catch((error) => console.error('Failed to save progress:', error));
		}
	}
</script>

{#if loading}
	<div class="loading-container">
		<Menu />
		<main class="loading-content">
			<div class="loader">
				<div class="loader-palette">
					<div class="color-dot color-1"></div>
					<div class="color-dot color-2"></div>
					<div class="color-dot color-3"></div>
					<div class="color-dot color-4"></div>
					<div class="color-dot color-5"></div>
				</div>
				<p class="loading-text">Загрузка...</p>
			</div>
		</main>
	</div>
{:else if error}
	<div class="error-container">
		<Menu />
		<main class="error-content">
			<h1>Oops! Something went wrong</h1>
			<p>{error}</p>
			<button onclick={() => window.location.reload()}>Try Again</button>
		</main>
	</div>
{:else if pageAssets && pageAssets.loadedData && pageAssets.loadedData.svg}
	<div class="app">
		<Menu pageId={pageAssets.page.id} />
		{#key canvasResetKey}
			<main class="main-page">
				<div class="main-page__layout">
					<div class="main-area__layout">
						<div class="canvas">
							<PictureCanvas
								svg={pageAssets.loadedData.svg}
								selectedColor={colors.find((color) => color.id === selectedColorId) || null}
								onCorrectColorClick={() => removeColor(selectedColorId)}
								originalImageUrl={pageAssets.assets.originalImage}
								{progressPercentage}
								{usedColorsIds}
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
					{#if pageAssets.page.description}
						<DescriptionBar
							text={pageAssets.page.description || ''}
							audioSrc={pageAssets.assets.audio}
						/>
					{/if}
				</div>
			</main>
		{/key}
	</div>
{/if}

<style>
	.main-page__layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	.main-area__layout {
		flex: 1 1 auto;
		display: flex;
		flex-direction: row;
		min-height: 0;
		overflow: hidden;
	}

	.main-page {
		overflow: hidden;
	}

	.loading-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: whitesmoke;
		overflow: hidden;
	}

	.loading-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
	}

	.loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		max-height: 100%;
	}

	.loader-palette {
		display: flex;
		gap: 8px;
		padding: 16px;
		background: white;
		border-radius: 50px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.color-dot {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		animation: colorPulse 1.5s ease-in-out infinite;
	}

	.color-dot:nth-child(1) {
		background-color: #ff6b6b;
		animation-delay: 0s;
	}

	.color-dot:nth-child(2) {
		background-color: #4ecdc4;
		animation-delay: 0.2s;
	}

	.color-dot:nth-child(3) {
		background-color: #45b7d1;
		animation-delay: 0.4s;
	}

	.color-dot:nth-child(4) {
		background-color: #96ceb4;
		animation-delay: 0.6s;
	}

	.color-dot:nth-child(5) {
		background-color: #feca57;
		animation-delay: 0.8s;
	}

	@keyframes colorPulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.7;
		}
		50% {
			transform: scale(1.2);
			opacity: 1;
		}
	}

	.loading-text {
		font-size: 1.1rem;
		color: #666;
		font-weight: 500;
		margin: 0;
		animation: textFade 2s ease-in-out infinite;
	}

	@keyframes textFade {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}

	.canvas {
		flex: 1;
		min-height: 0;
		overflow: hidden;
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

	@media (max-width: 768px) {
		.loader-palette {
			padding: 12px;
			gap: 6px;
		}

		.color-dot {
			width: 16px;
			height: 16px;
		}

		.loading-text {
			font-size: 1rem;
		}
	}
</style>
