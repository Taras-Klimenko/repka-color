<script lang="ts">
	import type { Color } from '$lib/types';

	export let colors: Color[] = [];
	export let selectedColorId: number | null = null;
	export let onSelect: (colorId: number) => void = () => {};
</script>

<div class="color-palette-container">
	<div class="color-palette">
		{#each colors as color}
			<button
				class="color-well {selectedColorId === color.id ? 'selected' : ''}"
				style="background-color: {color.hex};"
				on:click={() => onSelect(color.id)}><span class="color-id">{color.id}</span></button
			>
		{/each}
	</div>
</div>

<style>
	.color-palette-container {
		padding: 1rem;
	}

	.color-palette {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
		gap: 0.5rem;
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
	}

	.color-well.selected {
		border-color: #000;
	}

	.color-id {
		color: white;
		text-shadow: 0 0 2px #000;
		font-size: 1rem;
	}
</style>
