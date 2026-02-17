<script lang="ts">
	import { onMount } from 'svelte';
	import { user, isAuthenticated } from '$lib/stores/userState';
	import { UserProgressApi, type UserPageProgress } from '$lib/entities/userProgressApi';
	import PageCard from '$lib/components/PageCard.svelte';
	import { goto } from '$app/navigation';
	import '$lib/app.css';
	import { getColoringBookPageAssetUrl } from '$lib/utils/assetUrl';
	import Menu from '$lib/components/Menu.svelte';
	import SkeletonPreload from '$lib/components/SkeletonPreload.svelte';

	let completedPages: UserPageProgress[] = [];
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		if (!$isAuthenticated || !$user) {
			goto('/auth');
			return;
		}

		await loadCompletedPages();
	});

	async function loadCompletedPages() {
		if (!$user) return;

		try {
			loading = true;
			error = null;
			completedPages = await UserProgressApi.getCompletedPages($user.id);
		} catch (err) {
			error = 'Failed to load completed pages';
			console.error('Error loading completed pages:', err);
		} finally {
			loading = false;
		}
	}

	function handlePageClick(pageProgress: UserPageProgress) {
		if (pageProgress.coloringPage) {
			goto(
				`/coloring/${pageProgress.coloringPage.coloringBook.id}/${pageProgress.coloringPage.orderIndex}`
			);
		}
	}
</script>

<div class="completed-pages-container">
	<Menu />
	<main class="completed-pages-content">
		<div class="page-header">
			<div class="page-info">
				<h1 class="page-title">Завершенные раскраски</h1>
				<p class="page-description">Галерея ваших шедевров</p>
			</div>
		</div>

		{#if loading}
			<SkeletonPreload />
		{:else if error}
			<div class="error-container">
				<p class="error-message">{error}</p>
				<button type="button" class="retry-button" onclick={loadCompletedPages}>
					Попробовать снова
				</button>
			</div>
		{:else if completedPages.length === 0}
			<div class="empty-state">
				<div class="empty-icon">🎨</div>
				<h2>Здесь пока пусто</h2>
				<p>Начните раскрашивать и ваши готовые работы появятся здесь!</p>
				<button type="button" class="start-coloring-button" onclick={() => goto('/')}>
					Начать
				</button>
			</div>
		{:else}
			<div class="pages-grid">
				{#each completedPages as pageProgress, index (pageProgress.id)}
					{@const thumbnailUrl = getColoringBookPageAssetUrl(
						pageProgress.coloringPage!.coloringBook.id,
						pageProgress.coloringPage!.orderIndex
					).thumbnail}
					<PageCard
						page={pageProgress.coloringPage!}
						index={index + 1}
						pageProgress={pageProgress.progressPercentage}
						{thumbnailUrl}
						handlePageClick={() => handlePageClick(pageProgress)}
					/>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	:global(html),
	:global(body) {
		overflow: auto !important;
		height: auto !important;
	}

	.completed-pages-container {
		min-height: 100vh;
	}

	.completed-pages-content {
		padding: 80px 20px 40px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 40px;
	}

	.page-info {
		text-align: center;
	}

	.page-title {
		font-size: 2.5rem;
		margin: 0 0 10px 0;
		font-weight: 700;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.page-description {
		font-size: 1.1rem;
		margin: 0 0 10px 0;
		opacity: 0.9;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.pages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 30px;
		padding: 20px 0;
	}

	/* Error container styles */
	.error-container {
		text-align: center;
		padding: 40px;
	}

	.error-message {
		color: #e74c3c;
		font-size: 1.1rem;
		margin-bottom: 20px;
	}

	.retry-button {
		background: #3498db;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.retry-button:hover {
		background: #2980b9;
	}

	/* Empty state styles */
	.empty-state {
		text-align: center;
		padding: 80px 20px;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 20px;
	}

	.empty-state h2 {
		color: #333;
		margin: 0 0 15px 0;
		font-size: 1.8rem;
	}

	.empty-state p {
		color: #666;
		margin: 0 0 30px 0;
		font-size: 1.1rem;
	}

	.start-coloring-button {
		background: none;
		border: none;
		color: black;
		font-size: 1.5rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		padding: 10px 0;
	}

	.start-coloring-button:hover {
		padding-bottom: 5px;
		border-bottom: 5px solid black;
	}

	@media (max-width: 768px) {
		.completed-pages-content {
			padding: 60px 15px 30px;
		}

		.page-title {
			font-size: 2rem;
		}

		.pages-grid {
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
			gap: 20px;
		}
	}
</style>
