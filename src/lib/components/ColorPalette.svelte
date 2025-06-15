<script lang="ts">
	import type { Color } from '$lib/types';
	import { fade, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	const { colors, selectedColorId, onSelect, isAnimating, removingColorId } = $props<{
		colors: Color[];
		selectedColorId: number | null;
		onSelect: (colorId: number) => void;
		isAnimating: boolean;
		removingColorId: number | null;
	}>();
</script>

<div class="color-palette-container">
	<div class="color-palette {isAnimating ? 'no-snap' : ''}">
		{#each colors as color (color.id)}
			<button
				class="color-well {selectedColorId === color.id ? 'selected' : ''}"
				style="background-color: {color.hex};"
				onclick={() => onSelect(color.id)}
				animate:flip={{ duration: 300 }}
				out:scale={color.id === removingColorId ? { duration: 300 } : undefined}
			>
				<span class="color-id">{color.id}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.color-palette-container {
		padding: 1rem;
		width: 65px;
		box-sizing: content-box;
		height: 580px;
	}

	.color-palette {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		justify-content: flex-start;
		overflow-y: auto;
		gap: 0.5rem;
		max-height: 100%;
		scroll-snap-type: y proximity;
		scroll-snap-align: start;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.color-palette::-webkit-scrollbar {
		display: none;
	}

	.color-well {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 2px, solid, transparent;
		cursor: pointer;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		scroll-snap-align: start;
	}

	.color-well.selected {
		border-color: #000;
	}

	.color-id {
		color: white;
		text-shadow: 0 0 2px #000;
		font-size: 1rem;
	}

	.color-palette.no-snap {
		scroll-snap-type: none;
	}
</style>
