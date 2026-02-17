<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ColoringBookApi } from '$lib/entities/coloringBookApi';
	import { UserProgressApi, type UserPageProgress } from '$lib/entities/userProgressApi';
	import { user } from '$lib/stores/userState';
	import { getColoringBookPageAssetUrl } from '$lib/utils/assetUrl';
	import type { ColoringBook, ColoringBookPage } from '$lib/entities/coloringBookApi';
	import Menu from '$lib/components/Menu.svelte';
	import '$lib/app.css';
	import PageCard from '$lib/components/PageCard.svelte';

	const bookId = page.params.id;

	let book: ColoringBook = $state({
		id: 0,
		title: '',
		pageCount: 0,
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date()
	});
	let pages: ColoringBookPage[] = $state([]);
	let userProgress: UserPageProgress[] = $state([]);
	let isLoading: boolean = $state(true);
	let error: string = $state('');

	let progressMap = $derived.by(() => {
		const map = new Map<number, UserPageProgress>();
		userProgress.forEach((progress) => {
			map.set(progress.coloringPageId, progress);
		});
		return map;
	});

	onMount(async () => {
		try {
			const [bookData, pagesData] = await Promise.all([
				ColoringBookApi.getColoringBook(bookId),
				ColoringBookApi.getColoringBookPages(bookId)
			]);
			book = bookData;
			pages = pagesData;

			const currentUser = $user;
			if (currentUser) {
				try {
					userProgress = await UserProgressApi.getUserProgressByBookId(currentUser.id, book.id);
				} catch (err) {
					console.error('Failed to load user progress', err);
				}
			}
		} catch (err) {
			console.error('Failed to load book data', err);
			error = 'Не удалось загрузить данные о раскраске.';
		} finally {
			isLoading = false;
		}
	});

	function handlePageClick(page: ColoringBookPage) {
		goto(`/coloring/${bookId}/${page.orderIndex}`);
	}

	function getPageProgress(pageId: number): number {
		const progress = progressMap.get(pageId);
		return progress?.progressPercentage || 0;
	}
</script>

<div class="book-gallery-container">
	<Menu />
	<main class="book-gallery-content">
		<div class="book-header">
			<div class="book-info">
				<h1 class="book-title">{book.title}</h1>
				{#if book.description}
					<p class="book-description">{book.description}</p>
				{/if}
			</div>
		</div>

		<div class="pages-grid">
			{#each pages as page, index (page.id)}
				{@const pageProgress = $user ? getPageProgress(page.id) : 0}
				{@const thumbnailUrl = getColoringBookPageAssetUrl(book.id, page.orderIndex).thumbnail}
				<PageCard
					{page}
					index = {index + 1}
					{pageProgress}
					{thumbnailUrl}
					handlePageClick={() => handlePageClick(page)}
				/>
			{/each}
		</div>
	</main>
</div>

<style>
	:global(html),
	:global(body) {
		overflow: auto !important;
		height: auto !important;
	}

	.book-gallery-container {
		min-height: 100vh;
	}

	.book-gallery-content {
		padding: 80px 20px 40px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.book-header {
		margin-bottom: 40px;
	}

	.book-info {
		text-align: center;
	}

	.book-title {
		font-size: 2.5rem;
		margin: 0 0 10px 0;
		font-weight: 700;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.book-description {
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

	@media (max-width: 768px) {
		.book-gallery-content {
			padding: 60px 15px 30px;
		}

		.book-title {
			font-size: 2rem;
		}

		.pages-grid {
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
			gap: 20px;
		}
	}
</style>
