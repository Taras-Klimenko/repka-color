<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import AudioPlayer from './AudioPlayer.svelte';
	import { isTouchDevice } from '$lib/utils/isTouchDevice';
	import { user, authStore, isAuthenticated } from '$lib/stores/userState';
	import { goto } from '$app/navigation';
	import { userProgressStore } from '$lib/stores/userProgressState';

	const { bookId, orderIndex } = page.params;

	const { pageId } = $props<{ pageId?: number }>();

	let isMenuOpen = $state(false);
	let isTouchDeviceLayout = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function hideMenu() {
		isMenuOpen = false;
	}

	onMount(() => {
		isTouchDeviceLayout = isTouchDevice();
	});

	function handleBackToHomePage() {
		goto('/');
		hideMenu();
	}

	async function handleLogout() {
		await authStore.logout();
		goto('/auth');
	}

	function handleBackToColoringBook() {
		goto(`/coloring-book/${bookId}`);
		hideMenu();
	}

	function handleLogin() {
		goto('/auth');
		hideMenu();
	}

	async function handleRestart() {
		const currentUser = $user;
		if (currentUser) {
			await userProgressStore.clearPageProgress(pageId);
			userProgressStore.markPageForRestart(pageId);
		}

		window.dispatchEvent(new CustomEvent('restart-page', { detail: { pageId } }));
		hideMenu();
	}
</script>

<div class="nav-wrapper">
	<div
		class="menu-icon"
		onclick={toggleMenu}
		role="button"
		tabindex="0"
		onkeydown={(e) => (e.key === ' ' || e.key === 'Enter') && toggleMenu()}
	>
		<div class="bar1" class:active={isMenuOpen}></div>
		<div class="bar2" class:active={isMenuOpen}></div>
		<div class="bar3" class:active={isMenuOpen}></div>
	</div>
	<nav id="nav" class:active={isMenuOpen}>
		{#if $user?.id === -1}<p class="guest-account-notice">Используется гостевой аккаунт</p>{/if}
		<ul>
			<li><a onclick={handleBackToHomePage}>На главную</a></li>
			{#if bookId && orderIndex}
				<li><a onclick={handleBackToColoringBook}>К раскраске</a></li>
				<li>
					<a onclick={handleRestart}>Начать заново</a>
				</li>
			{/if}
			{#if $user?.id !== -1}
				<li><a onclick={handleLogout}>Выйти</a></li>
			{:else}
				<li><a onclick={handleLogin}>Войти</a></li>
			{/if}
		</ul>
		{#if isTouchDeviceLayout}
			<div class="audio-player-container-mobile"><AudioPlayer /></div>
		{/if}
	</nav>
	<div
		class="backdrop"
		onclick={hideMenu}
		class:visible={isMenuOpen}
		onkeydown={(e) => e.key === 'Escape' && hideMenu()}
		role="button"
		tabindex="0"
	></div>
	{#if !isTouchDeviceLayout}
		<div class="audio-player-container"><AudioPlayer /></div>
	{/if}
</div>

<style>
	.menu-icon {
		border-radius: 8px;
		padding: 5px;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		cursor: pointer;
		position: fixed;
		top: 15px;
		left: 15px;
		width: 2.6rem;
		height: 2.6rem;
		z-index: 100;
		background-color: rgba(255, 255, 255, 0.65);
	}

	.menu-icon div {
		height: 0.25rem;
		background-color: black;
		transition:
			transform 0.3s ease-in-out,
			opacity 0.3s ease-in-out;
	}

	.active.bar1 {
		transform: translateY(0.6rem) rotate(-45deg);
	}

	.active.bar2 {
		opacity: 0;
	}

	.active.bar3 {
		transform: translateY(-0.7rem) rotate(45deg);
	}

	.nav-wrapper {
		height: 60px;
		position: fixed;
		top: 0;
		left: 0;
		width: fit-content;
		z-index: 100;
	}

	.guest-account-notice {
		text-align: center;
	}

	nav {
		height: 100%;
		color: black;
		position: fixed;
		top: 0;
		left: 0;
		transform: translateX(-100%);
		transition: transform 0.4s ease-in-out;
		width: 33vw;
		z-index: 2;
		background: rgba(255, 255, 255, 0.65);
		backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
	}

	nav ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 85%;
		font-size: 2rem;
	}

	nav a {
		text-decoration: none;
		color: black;
		cursor: pointer;

		&:hover {
			padding-bottom: 5px;
			border-bottom: 5px solid black;
		}
	}

	nav ul li {
		margin: 1rem 0;
	}

	nav.active {
		transform: translateX(0);
	}

	.backdrop {
		position: fixed;
		top: 0;
		left: 33vw;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.2);
		z-index: 1;
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}
	.backdrop.visible {
		opacity: 1;
		pointer-events: auto;
	}

	.audio-player-container {
		position: fixed;
		right: 15px;
		top: 15px;
		z-index: 5;
	}

	.audio-player-container-mobile {
		position: static;
	}

	@media (max-width: 1024px) {
		nav {
			width: 100vw;
		}
		.backdrop {
			display: none;
		}
	}

	@media (max-width: 1023px) and (orientation: landscape) {
		nav ul {
			font-size: 1.5rem;
		}

		.audio-player-container-mobile {
			margin-bottom: 2vh;
		}
	}
</style>
