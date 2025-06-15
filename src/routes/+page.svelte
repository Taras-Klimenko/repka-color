<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import PictureCanvas from '$lib/components/PictureCanvas.svelte';
	import ColorPalette from '$lib/components/ColorPalette.svelte';
	import DescriptionBar from '$lib/components/DescriptionBar.svelte';
	import svg from '../lib/assets/processed/final.svg?raw';
	import rawColors from '$lib/assets/processed/colors.json';
	import type { Color } from '$lib/types';
	import { tick } from 'svelte';

	let colors: Color[] = [...rawColors];
	let selectedColorId: number | null = null;
	let isPaletteAnimating = false;
	let removingColorId: number | null = null;

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
	<Header />
	<main>
		<PictureCanvas
			{svg}
			selectedColor={colors.find((color) => color.id === selectedColorId) || null}
			onCorrectColorClick={() => removeColor(selectedColorId)}
			originalImageUrl="/src/lib/assets/original/jjk.jpg"
		/>
		<ColorPalette
			{colors}
			{selectedColorId}
			onSelect={handleSelect}
			isAnimating={isPaletteAnimating}
			{removingColorId}
		/>
	</main>
	<DescriptionBar
		text="Репка росла и стала большая-пребольшая"
		audioSrc="/audio/repka-line-1.mp3"
	/>
</div>

<style>
	main {
		display: flex;
	}
</style>
