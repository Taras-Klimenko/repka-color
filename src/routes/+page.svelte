<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import PictureCanvas from '$lib/components/PictureCanvas.svelte';
	import ColorPalette from '$lib/components/ColorPalette.svelte';
	import DescriptionBar from '$lib/components/DescriptionBar.svelte';
	import svg from '../lib/assets/processed/final.svg?raw';
	import colors from '$lib/assets/processed/colors.json';

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
