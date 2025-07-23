<script lang="ts">
	import PictureCanvas from '$lib/components/PictureCanvas.svelte';
	import ColorPalette from '$lib/components/ColorPalette.svelte';
	import DescriptionBar from '$lib/components/DescriptionBar.svelte';
	import svg from '../../../lib/assets/processed/final.svg?raw';
	import rawColors from '$lib/assets/processed/colors.json';
	import type { Color } from '$lib/types';
	import { tick } from 'svelte';
	import Menu from '$lib/components/Menu.svelte';
	import '$lib/app.css';

	let colors: Color[] = [...rawColors];
	let selectedColorId: number | null = null;
	let isPaletteAnimating = false;
	let removingColorId: number | null = null;

	let hasDescriptionBar = true;

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

<div class="app">
	<Menu />
	<main>
		<div class="main-page__layout">
			<div class="main-area__layout">
				<div class="canvas">
					<PictureCanvas
						{svg}
						selectedColor={colors.find((color) => color.id === selectedColorId) || null}
						onCorrectColorClick={() => removeColor(selectedColorId)}
						originalImageUrl="/assets/original/jjk.jpg"
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
				text="Репка росла и стала большая-пребольшая"
				audioSrc="/audio/repka-line-1.mp3"
			/>
		</div>
	</main>
</div>

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
