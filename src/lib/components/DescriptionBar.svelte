<script lang="ts">
	export let text: string;
	export let audioSrc: string;

	let audioElement: HTMLAudioElement;

	function handlePlay() {
		if (audioElement) {
			audioElement.play();
		}
	}
</script>

<div class="description-bar-container">
	<button class="play-button" on:click={handlePlay}>▶️</button>
	<p class="description-text">{text}</p>
	<audio src={audioSrc} bind:this={audioElement} preload="auto"></audio>
</div>

<style>
	.description-bar-container {
		display: flex;
		align-items: center;
		background-color: #f9f9f9;
		padding: 1rem;
		border-top: 2px solid #ddd;
		font-size: 1.2rem;
	}

	.description-text {
		flex: 1;
		margin-left: 1rem;
		color: #333;
	}

	.play-button {
		font-size: 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: #555;
	}
</style>
