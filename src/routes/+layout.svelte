<script lang="ts">
    import {onMount} from 'svelte';
    import {authStore, isAuthenticated, isLoading, isInitialized, user} from '$lib/stores/userState';
    import {goto} from '$app/navigation';
    import '$lib/app.css';


    onMount(async () => {
        await authStore.initialize();
    })
</script>

{#if !$isInitialized || $isLoading }
    <div class="loading-screen"></div>
{:else}
    <slot />
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