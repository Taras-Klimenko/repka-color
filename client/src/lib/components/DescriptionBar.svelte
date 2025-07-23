<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isVoiceoverPlaying } from '$lib/stores/audioState';

	const { text, audioSrc } = $props<{ text: string; audioSrc: string }>();

	let audioElement: HTMLAudioElement;
	let isPlaying = $state(false);
	let currentWordIndex = $state(-1);
	const words = text.split(' ');

	let rafId: number | null = null;

	let wordRefs = $state<Array<HTMLElement | null>>([]);

	function updateWordHighlight() {
		if (!audioElement || !audioElement.duration) return;
		const progress = audioElement.currentTime / audioElement.duration;
		currentWordIndex = Math.floor(progress * words.length);
		rafId = requestAnimationFrame(updateWordHighlight);
	}

	function handlePlay() {
		if (!audioElement) return;

		if (audioElement.paused) {
			isVoiceoverPlaying.set(true);
			isPlaying = true;
			audioElement.play();
			updateWordHighlight();
		} else {
			audioElement.pause();
			isPlaying = false;
			isVoiceoverPlaying.set(false);
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		}
	}

	onMount(() => {
		audioElement?.addEventListener('ended', () => {
			isPlaying = false;
			isVoiceoverPlaying.set(false);
			currentWordIndex = words.length - 1;
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		});
	});

	onDestroy(() => {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	});

	$effect(() => {
		if (currentWordIndex >= 0 && wordRefs[currentWordIndex]) {
			wordRefs[currentWordIndex]?.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'start'
			});
		}
	});
</script>

<div class="description-bar-container">
	<button class="play-button" onclick={handlePlay}
		>{#if isPlaying}
			⏸️
		{:else}
			▶️
		{/if}</button
	>
	<div class="description-text-scroll">
		<p class="description-text">
			{#each words as word, index}<span
					class:highlighted={index <= currentWordIndex}
					bind:this={wordRefs[index]}
					>{word + ' '}
				</span>{/each}
		</p>
	</div>
	<audio src={audioSrc} bind:this={audioElement} preload="auto"></audio>
</div>

<style>
	.description-bar-container {
		display: flex;
		align-items: flex-start;
		height: 10vh;
		background: rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(6px);
		padding: 5px 1.25rem;
		border-top: 2px solid #ddd;
		font-size: 1.2rem;
		border-radius: 0 0 1rem 1rem;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
	}

	.description-text-scroll {
		flex: 1;
		overflow-y: auto;
		max-height: 100%;
	}

	.description-text {
		color: #333;
		letter-spacing: 0.02em;
		font-weight: 500;
		line-height: 1.6;
		font-size: clamp(1.1rem, 2.5vh, 1.7rem);
	}

	.play-button {
		flex-shrink: 0;
		align-self: center;
		margin-right: 1rem;
		font-size: 1.4rem;
		background: none;
		border: none;
		cursor: pointer;
		color: #444;
		transition: transform 0.2s ease;
	}
	.play-button:hover {
		transform: scale(1.1);
	}

	.highlighted {
		color: #000;
		background: rgba(255, 235, 59, 0.5);
		border-radius: 4px;
		transition: background 0.3s ease;
	}
</style>
