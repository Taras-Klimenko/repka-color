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
		padding: clamp(0.5rem, 1vw, 1.5rem);
		width: clamp(55px, 7vw, 120px);
		margin-right: 1vw;
		box-sizing: content-box;
		height: 62vh;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		border-radius: 32px;
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
	}

	.color-well.selected {
		border-color: #000;
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
