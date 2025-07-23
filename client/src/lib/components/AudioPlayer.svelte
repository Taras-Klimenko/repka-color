<script lang="ts">
	import { onMount } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { isVoiceoverPlaying } from '$lib/stores/audioState';
	import '$lib/icons';

	let isPlaying = $state(false);
	let isShuffled = $state(false);
	let volume = $state(1);
	let currentTrackIndex = $state(0);
	let wasPlayingBeforeVoiceover = $state(false);
	let audio: HTMLAudioElement;

	const playlist = [
		{
			name: 'Hope - Heroes of Might and Magic 4 Original Soundtrack',
			src: '/audio/ambient/Hope.mp3'
		},
		{
			name: 'Blade of Steel - Witcher 3 Original Soundtrack',
			src: '/audio/ambient/Blade of Steel.mp3'
		},
		{
			name: 'Yennefer of Vengerberg - Witcher 3 Original Soundtrack',
			src: '/audio/ambient/Yennefer of Vengerberg.mp3'
		}
	];

	// === Player control handlers ===

	function loadTrack(index: number) {
		if (audio) {
			audio.pause();
			audio.removeEventListener('ended', handleNextTrack);
		}

		audio?.pause();
		const track = playlist[index];
		audio = new Audio(track.src);
		audio.volume = volume;
		audio.loop = false;
		audio.addEventListener('ended', handleNextTrack);
		audio.addEventListener('play', () => (isPlaying = true));
		audio.addEventListener('pause', () => (isPlaying = false));
		audio.play();
	}

	function togglePlay() {
		if (!audio) return;
		audio.paused ? audio.play() : audio.pause();
	}

	function getRandomIndex(exclude: number): number {
		let newIndex;
		do {
			newIndex = Math.floor(Math.random() * playlist.length);
		} while (newIndex === exclude && playlist.length > 1);
		return newIndex;
	}

	function handleNextTrack() {
		currentTrackIndex = isShuffled
			? getRandomIndex(currentTrackIndex)
			: (currentTrackIndex + 1) % playlist.length;
		loadTrack(currentTrackIndex);
	}

	function handlePrevTrack() {
		currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
		loadTrack(currentTrackIndex);
	}

	function toggleShuffle() {
		isShuffled = !isShuffled;
	}

	function changeVolume(v: number) {
		volume = v;
		if (audio) audio.volume = v;
	}

	$effect(() => {
		if ($isVoiceoverPlaying) {
			// Voiceover started: pause music if playing
			if (!audio.paused) {
				wasPlayingBeforeVoiceover = true;
				audio.pause();
			}
		} else {
			// Voiceover ended: resume music if it was playing
			if (wasPlayingBeforeVoiceover) {
				audio.play();
				wasPlayingBeforeVoiceover = false;
			}
		}
	});

	onMount(() => {
		loadTrack(currentTrackIndex);
	});
</script>

<div class="audio-player-wrapper">
	<div class="audio-player">
		<div
			class="vinyl-icon {isPlaying ? 'spin' : ''}"
			onclick={togglePlay}
			tabindex="0"
			role="button"
			onkeydown={(e) => (e.key === ' ' || e.key === 'Enter') && togglePlay()}
		></div>
		<div class="player-content">
			<div class="track-title-wrapper">
				<div class="track-title" class:scroll={playlist[currentTrackIndex].name.length > 20}>
					{playlist[currentTrackIndex].name}
				</div>
			</div>
			<div class="controls">
				<button onclick={handlePrevTrack} aria-label="Previous Track" class="icon-button"
					><FontAwesomeIcon icon="backward-step" fixedWidth class="fa-icon" /></button
				>
				<button onclick={togglePlay} aria-label="Play/Pause" class="icon-button"
					>{#key isPlaying}<FontAwesomeIcon
							class="fa-icon"
							icon={isPlaying ? 'pause' : 'play'}
							fixedWidth
						/>{/key}</button
				>
				<button onclick={handleNextTrack} aria-label="Next Track" class="icon-button"
					><FontAwesomeIcon icon="forward-step" fixedWidth class="fa-icon" /></button
				>
				<button
					onclick={toggleShuffle}
					aria-label="Toggle Shuffle"
					class:active={isShuffled}
					class="icon-button"><FontAwesomeIcon icon="shuffle" fixedWidth class="fa-icon" /></button
				>
				<button class="icon-button volume-icon-button"
					>{#key volume}
						<FontAwesomeIcon
							fixedWidth
							class="icon-button fa-icon"
							icon={volume < 0.2 ? 'volume-off' : volume < 0.6 ? 'volume-low' : 'volume-high'}
						/>
					{/key}</button
				>

				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={volume}
					oninput={(e) => changeVolume(+e.currentTarget.value)}
					style={`--volume: ${volume}`}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.audio-player-wrapper {
		position: relative;
		display: flex;
		width: fit-content;
		transition: all 0.4s ease;
	}

	.audio-player-wrapper:hover .audio-player {
		height: 70px;
		width: 360px;
		padding: 0.75rem 1rem 0.75rem 0.5rem;
	}

	.audio-player {
		display: flex;
		align-items: center;
		/* justify-content: center; */
		padding: 4.5px;
		width: 70px;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-radius: 2.5rem;
		border: 1px solid rgba(255, 255, 255, 0.25);
		box-shadow:
			0 4px 30px rgba(0, 0, 0, 0.1),
			inset 0 0 0.5px rgba(255, 255, 255, 0.4);
		user-select: none;
		overflow: hidden;
		transition: width 0.6s ease;
	}

	.player-content {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition:
			opacity 1s ease,
			width 1s ease;
	}
	.audio-player-wrapper:hover .player-content {
		opacity: 1;
		width: auto;
		overflow: visible;
	}

	.vinyl-icon {
		width: 60px;
		height: 60px;
		background-image: url('/vinyl-record.png');
		background-size: cover;
		background-position: center;
		border-radius: 50%;
		flex-shrink: 0;
		cursor: pointer;
	}

	.spin {
		animation: spin 4s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.track-title-wrapper {
		overflow: hidden;
		flex: 1;
	}

	.track-title {
		white-space: nowrap;
		font-weight: bold;
		font-size: 1rem;
		color: #333;
		transition: transform 0.3s;
	}

	.track-title.scroll {
		animation: scroll-title 12s linear infinite;
	}

	@keyframes scroll-title {
		0%,
		10% {
			transform: translateX(0%);
		}
		90%,
		100% {
			transform: translateX(-100%);
		}
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		margin-left: 1.25rem;
	}

	:global(.fa-play) {
		height: 1.1rem;
	}

	.icon-button {
		width: 1.2em;
		height: 1.2em;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.controls button {
		background: none;
		border: none;
		font-size: 1.2em;
		cursor: pointer;
		opacity: 1;
		transition: opacity 0.3s;
	}

	.controls button:hover {
		opacity: 0.6;
	}

	.volume-icon-button {
		pointer-events: none;
	}

	.controls button.active {
		color: #4a90e2;
	}

	.controls input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100px;
		height: 6px;
		background: linear-gradient(
			to right,
			#666 0%,
			#666 calc(var(--volume, 1) * 100%),
			#ccc calc(var(--volume, 1) * 100%),
			#ccc 100%
		);
		border-radius: 3px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.controls input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		background-color: #666;
		border-radius: 50%;
		border: 2px solid #fff;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		transition: background 0.2s;
	}

	.controls input[type='range']::-moz-range-thumb {
		width: 14px;
		height: 14px;
		background-color: #666;
		border: 2px solid #fff;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
		border-radius: 50%;
		cursor: pointer;
	}

	/* Track fill for Firefox */
	.controls input[type='range']::-moz-range-track {
		background: linear-gradient(
			to right,
			#666 0%,
			#666 calc(var(--volume, 1) * 100%),
			#ccc calc(var(--volume, 1) * 100%),
			#ccc 100%
		);
		height: 6px;
		border-radius: 3px;
	}

	.controls input[type='range']:active::-webkit-slider-thumb {
		background: #4a90e2;
	}
	.controls input[type='range']:active::-moz-range-thumb {
		background: #4a90e2;
	}

	:global(.audio-player-container-mobile) .audio-player-wrapper {
		margin: 0 auto;
	}

	:global(.audio-player-container-mobile) .audio-player {
		height: 70px;
		width: 360px;
		padding: 0.75rem 1rem 0.75rem 0.5rem;
		background: rgba(255, 255, 255, 0.65);
	}

	:global(.audio-player-container-mobile) .player-content {
		opacity: 1;
		width: auto;
		overflow: visible;
	}
</style>
