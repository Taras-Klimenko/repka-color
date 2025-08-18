<script lang="ts">
	import { onMount } from 'svelte';
	import {
		authStore,
		isAuthenticated,
		isLoading,
		isInitialized,
		user,
		isGuest
	} from '$lib/stores/userState';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { registerServiceWorker, checkForAppUpdate } from '$lib/pwa';
	import '$lib/app.css';

	let { children } = $props();

	onMount(async () => {
		await authStore.initialize();
		registerServiceWorker();
		checkForAppUpdate();
	});

	$effect(() => {
		if ($isInitialized && !$isLoading) {
			const currentPath = page.url.pathname;
			const isAuthPage = currentPath === '/auth';
			const canAccessApp = $isAuthenticated || $isGuest;

			if ($isAuthenticated && !$isGuest && isAuthPage) {
				goto('/');
			} else if (!canAccessApp && !isAuthPage) {
				goto('/auth');
			}
		}
	});
</script>

{#if !$isInitialized || $isLoading}
	<div class="loading-screen"></div>
{:else}
	{@render children?.()}
{/if}

<style>
	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		width: 100vw;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		font-family: 'Montserrat', sans-serif;
	}
</style>
