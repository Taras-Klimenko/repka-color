<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ColoringBookApi } from '$lib/entities/coloringBookApi';
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
	let isLoading: boolean = $state(true);
	let error: string = $state('');

	onMount(async () => {
		try {
			const [bookData, pagesData] = await Promise.all([
				ColoringBookApi.getColoringBook(bookId),
				ColoringBookApi.getColoringBookPages(bookId)
			]);
			book = bookData;
			pages = pagesData;
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
				<p class="page-count">{pages.length} pages</p>
			</div>
		</div>

		<div class="pages-grid">
			{#each pages as page (page.id)}
				<div class="page-card" onclick={() => handlePageClick(page)}>
					<div class="page-thumbnail">
						<img
							src={getColoringBookPageAssetUrl(book.id, page.orderIndex).thumbnail}
							alt={page.title}
							loading="lazy"
							onerror={(e) => {
								// Fallback to original image if thumbnail doesn't exist
								e.target.src = getColoringBookPageAssetUrl(book.id, page.orderIndex).originalImage;
							}}
						/>
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
		height: 200px;
		overflow: hidden;
	}

	.page-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
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
