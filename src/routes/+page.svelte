<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import PictureCanvas from '$lib/components/PictureCanvas.svelte';
	import ColorPalette from '$lib/components/ColorPalette.svelte';
	import DescriptionBar from '$lib/components/DescriptionBar.svelte';
	import type { Color } from '$lib/types';

	const svg = `
<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="80" height="80" fill="#ffffff" stroke="#000" data-color-id="1"/>
  <circle cx="150" cy="50" r="40" fill="#ffffff" stroke="#000" data-color-id="2"/>
</svg>`;

	let colors: Color[] = [
		{ id: 1, hex: '#FF0000' },
		{ id: 2, hex: '#00FF00' },
		{ id: 3, hex: '#0000FF' }
	];

	let selectedColorId: number | null = null;

	function handleSelect(colorId: number) {
		selectedColorId = colorId;
	}
</script>

<div class="app">
	<Header />
	<main>
		<PictureCanvas {svg} selectedColor={colors.find((color) => color.id === selectedColorId)} />
		<ColorPalette {colors} {selectedColorId} onSelect={handleSelect} />
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
