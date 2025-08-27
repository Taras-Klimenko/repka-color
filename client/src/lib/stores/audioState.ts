import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export type AudioTrack = {
	name: string;
	src: string;
};

export type AudioState = {
	isPlaying: boolean;
	isShuffled: boolean;
	volume: number;
	currentTrackIndex: number;
	wasPlayingBeforeVoiceover: boolean;
	playlist: AudioTrack[];
};

const defaultPlaylist: AudioTrack[] = [
	{
		name: 'Winter Sports - Nonak',
		src: '/audio/ambient/Winter Sports.mp3'
	},
	{
		name: 'Sati Bowl - Off Beat',
		src: '/audio/ambient/Sati Bowl.mp3'
	},
	{
		name: 'Subtle Affair - Kike Gutz',
		src: '/audio/ambient/Subtle Affair.mp3'
	},
	{
		name: 'Harmony Threshold - MudiG',
		src: '/audio/ambient/Harmony Threshold.mp3'
	}
];

const initialAudioState: AudioState = {
	isPlaying: false,
	isShuffled: false,
	volume: 0.7,
	currentTrackIndex: 0,
	wasPlayingBeforeVoiceover: false,
	playlist: defaultPlaylist
};

export const audioState = writable<AudioState>(initialAudioState);

let globalAudioElement: HTMLAudioElement | null = null;
let fadeInInterval: number | null = null;
let userInteraction = false;

export const audioController = {
	init() {
		if (!browser) {
			return;
		}

		if (!globalAudioElement) {
			globalAudioElement = new Audio();
			globalAudioElement.volume = 0;
			globalAudioElement.loop = false;

			globalAudioElement.addEventListener('ended', () => {
				audioController.nextTrack();
			});

			globalAudioElement.addEventListener('play', () => {
				audioState.update((state) => ({ ...state, isPlaying: true }));
			});

			globalAudioElement.addEventListener('pause', () => {
				audioState.update((state) => ({ ...state, isPlaying: false }));
			});

			this.setupUserInteractionListener();
		}
	},

	setupUserInteractionListener() {
		if (!browser) {
			return;
		}

		const handleUserInteraction = () => {
			if (!userInteraction) {
				userInteraction = true;
				this.loadTrackWithFadeIn(0);

				document.removeEventListener('click', handleUserInteraction);
				document.removeEventListener('keydown', handleUserInteraction);
				document.removeEventListener('touchstart', handleUserInteraction);
			}
		};

		document.addEventListener('click', handleUserInteraction);
		document.addEventListener('keydown', handleUserInteraction);
		document.addEventListener('touchstart', handleUserInteraction);
	},

	loadTrackWithFadeIn(trackIndex: number) {
		if (!globalAudioElement || !browser) {
			return;
		}

		const state = get(audioState);
		const track = state.playlist[trackIndex];

		if (fadeInInterval) {
			clearInterval(fadeInInterval);
			fadeInInterval = null;
		}

		globalAudioElement.src = track.src;
		globalAudioElement.volume = 0;

		globalAudioElement
			.play()
			.then(() => {
				this.startFadeIn(state.volume);
			})
			.catch((error) => {
				console.error('Failed to start audio playback: ', error);
			});

		audioState.update((state) => ({ ...state, currentTrackIndex: trackIndex }));
	},

	startFadeIn(targetVolume: number, duration: number = 3000) {
		if (!globalAudioElement || !browser) {
			return;
		}

		const startVolume = 0;
		const step = targetVolume / (duration / 50);
		let currentVolume = startVolume;

		fadeInInterval = window.setInterval(() => {
			currentVolume = Math.min(currentVolume + step, targetVolume);

			if (globalAudioElement) {
				globalAudioElement.volume = currentVolume;
			}

			if (currentVolume >= targetVolume) {
				if (fadeInInterval) {
					clearInterval(fadeInInterval);
					fadeInInterval = null;
				}
			}
		}, 50);
	},

	loadTrack(trackIndex: number) {
		if (!globalAudioElement || !browser) {
			return;
		}

		const state = get(audioState);
		const track = state.playlist[trackIndex];

		globalAudioElement.src = track.src;
		globalAudioElement.volume = state.volume;
		globalAudioElement.play();

		audioState.update((state) => ({ ...state, currentTrackIndex: trackIndex }));
	},

	play() {
		if (globalAudioElement && browser) {
			globalAudioElement.play();
		}
	},

	pause() {
		if (globalAudioElement && browser) {
			globalAudioElement.pause();
		}
	},

	togglePlay() {
		if (!globalAudioElement || !browser) {
			return;
		}
		if (globalAudioElement.paused) {
			globalAudioElement.play();
		} else {
			globalAudioElement.pause();
		}
	},

	nextTrack() {
		const state = get(audioState);
		const newIndex = state.isShuffled
			? audioController.getRandomIndex(state.currentTrackIndex)
			: (state.currentTrackIndex + 1) % state.playlist.length;

		audioController.loadTrack(newIndex);
	},

	previousTrack() {
		const state = get(audioState);
		const newIndex = (state.currentTrackIndex - 1 + state.playlist.length) % state.playlist.length;

		audioController.loadTrack(newIndex);
	},

	getRandomIndex(exclude: number): number {
		const state = get(audioState);
		let newIndex;

		do {
			newIndex = Math.floor(Math.random() * state.playlist.length);
		} while (newIndex === exclude && state.playlist.length > 1);

		return newIndex;
	},

	toggleShuffle() {
		audioState.update((state) => ({ ...state, isShuffled: !state.isShuffled }));
	},

	setVolume(volume: number) {
		if (globalAudioElement && browser) {
			globalAudioElement.volume = volume;
		}
		audioState.update((state) => ({ ...state, volume }));
	},

	handleVoiceoverStart() {
		const state = get(audioState);

		if (globalAudioElement && browser && !globalAudioElement.paused) {
			audioState.update((state) => ({ ...state, wasPlayingBeforeVoiceover: true }));
			globalAudioElement.pause();
		}
	},

	handleVoiceoverEnd() {
		const state = get(audioState);

		if (globalAudioElement && browser && state.wasPlayingBeforeVoiceover) {
			audioState.update((state) => ({ ...state, wasPlayingBeforeVoiceover: false }));
			globalAudioElement.play();
		}
	},

	cleanup() {
		if (globalAudioElement && browser) {
			globalAudioElement.pause();
			globalAudioElement.src = '';
			globalAudioElement = null;
		}
	}
};

export const isVoiceoverPlaying = writable(false);

audioController.init();
