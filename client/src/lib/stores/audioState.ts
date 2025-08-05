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

export const audioController = {
	init() {
		if (!browser) {
			return;
		}

		if (!globalAudioElement) {
			globalAudioElement = new Audio();
			globalAudioElement.volume = initialAudioState.volume;
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
		}
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
