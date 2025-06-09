<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import PictureCanvas from '$lib/components/PictureCanvas.svelte';
	import ColorPalette from '$lib/components/ColorPalette.svelte';
	import DescriptionBar from '$lib/components/DescriptionBar.svelte';
	import svg from '../lib/assets/processed/final.svg?raw';
	import rawColors from '$lib/assets/processed/colors.json';

	let colors = [...rawColors];
	let selectedColorId: number | null = null;

	function handleSelect(colorId: number) {
		selectedColorId = colorId;
	}

	function removeColor(colorId: number | null) {
		if (colorId === null) return;

		const index = colors.findIndex((c) => c.id === colorId);
		if (index === -1) return;

		colors.splice(index, 1);
		colors = [...colors]; // trigger reactivity

		// Auto-select next color (if any)
		if (colors.length > 0) {
			const nextIndex = index < colors.length ? index : colors.length - 1;
			selectedColorId = colors[nextIndex].id;
		} else {
			selectedColorId = null;
		}
	}
</script>

<div class="app">
	<Header />
	<main>
		<PictureCanvas
			{svg}
			selectedColor={colors.find((color) => color.id === selectedColorId)}
			onCorrectColorClick={() => removeColor(selectedColorId)}
			originalImageUrl="/src/lib/assets/original/jjk.jpg"
		/>
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
