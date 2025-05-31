<script lang="ts">
	import { onMount } from 'svelte';
	import type { Color } from '$lib/types';

	export let svg: string = '';
	export let selectedColor: Color | null = null;

	let container: HTMLDivElement;

	function handleClick(event: MouseEvent) {
		const target = event.target as SVGElement;

		if (!(target instanceof SVGElement) || !target.dataset.colorId) return;
		if (!selectedColor || target.dataset.colorId !== String(selectedColor.id)) return;

		target.setAttribute('fill', selectedColor.hex);
	}

	onMount(() => {
		container.addEventListener('click', handleClick);
	});
</script>

<div class="picture-canvas" bind:this={container}>
	{@html svg}
</div>

<style>
	.picture-canvas {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}
</style>
