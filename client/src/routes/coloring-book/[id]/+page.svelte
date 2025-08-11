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
			{#each pages as page (page.id)}
				{@const pageProgress = $user ? getPageProgress(page.id) : 0}
				{@const thumbnailUrl = getColoringBookPageAssetUrl(book.id, page.orderIndex).thumbnail}
				{@const originalImageUrl = getColoringBookPageAssetUrl(
					book.id,
					page.orderIndex
				).originalImage}

				<div class="page-card" onclick={() => handlePageClick(page)}>
					<div class="page-thumbnail">
						{#if $user && pageProgress === 100}
						<div class="completion-badge">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
							</svg>
						</div>
						{/if}
						<img
							class="thumbnail-bw"
							src={thumbnailUrl}
							alt={page.title}
							loading="lazy"
							onerror={(e) => {
								// Fallback to original image if thumbnail doesn't exist
								e.target.src = originalImageUrl;
							}}
						/>
						{#if $user && pageProgress > 0}
							<div class="thumbnail-colored" style="--progress-width: {pageProgress}%;">
								<img
									src={thumbnailUrl}
									alt={page.title}
									loading="lazy"
									onerror={(e) => {
										e.target.src = originalImageUrl;
									}}
								/>
							</div>
						{/if}
						<div class="page-overlay">
							<span class="page-number">{page.orderIndex}</span>
						</div>
					</div>
					<div class="page-info">
						<h3 class="page-title">{page.title}</h3>
					</div>
				</div>
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

	.page-count {
		font-size: 1rem;
		opacity: 0.8;
		margin: 0;
	}

	.pages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 30px;
		padding: 20px 0;
	}

	.page-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 15px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		cursor: pointer;
		backdrop-filter: blur(10px);
	}

	.page-thumbnail {
		position: relative;
		width: 100%;
		height: 280px;
		overflow: hidden;
	}

	.thumbnail-bw {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(100%);
	}

	.thumbnail-colored {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		overflow: hidden;
		clip-path: inset(0 calc(100% - var(--progress-width, 0%)) 0 0);
	}

	.thumbnail-colored img {
		width: 100vw;
		height: 100%;
		object-fit: cover;
	}

	.page-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.page-overlay {
		position: absolute;
		top: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: bold;
	}

	.completion-badge {
		position: absolute;
		top: 10px;
		left: 10px;
		background: #22c55e;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
	}

	.completion-badge svg {
		width: 24px;
		height: 24px;
	}

	.page-info {
		padding: 20px;
	}

	.page-title {
		font-size: 1.2rem;
		margin: 0 0 8px 0;
		color: #333;
		font-weight: 600;
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
