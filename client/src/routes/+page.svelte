<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { type ColoringBook, ColoringBookApi } from '$lib/entities/coloringBookApi';
	import Menu from '$lib/components/Menu.svelte';
	import '$lib/app.css';

	let coloringBooks: ColoringBook[] = $state([]);
	let isLoading: boolean = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			coloringBooks = await ColoringBookApi.getColoringBooks();
		} catch (err) {
			console.error('Failed to fetch coloring books', err);
			error = 'Не удалось загрузить раскраски.';
		} finally {
			isLoading = false;
		}
	});

	function handleBookClick(bookId: number) {
		goto(`/coloring-book/${bookId}`);
	}
</script>

<div class="main-page-container">
	<Menu />
	<main class="main-page-content">
		<div class="books-grid-container">
			{#each coloringBooks as book (book.id)}
				<div class="book-card" onclick={() => handleBookClick(book.id)}>
					<div class="book-cover">
						<img src={`${import.meta.env.VITE_API_BASE_URL}/assets/coloring-books/${book.id}/cover.jpg`} alt={book.title} loading="lazy" />
					</div>
					<div class="book-info">
						<h3 class="book-title">{book.title}</h3>
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

	.main-page-container {
		min-height: 100vh;
	}

	.main-page-content {
		padding: 80px 20px 40px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.books-grid-container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 30px;
		padding: 20px 0;
	}

	.book-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 15px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		cursor: pointer;
		backdrop-filter: blur(10px);
	}

	.book-cover {
		width: 100%;
		height: 200px;
		overflow: hidden;
		position: relative;
	}

	.book-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.book-info {
		padding: 20px;
	}

	.book-title {
		font-size: 1.3rem;
		font-weight: 600;
		margin-bottom: 8px;
		color: #333;
	}

	@media (max-width: 768px) {
		.main-page-content {
			padding: 60px 15px 30px;
		}

		.books-grid-container {
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
			gap: 20px;
		}

		.book-cover {
			height: 180px;
		}
	}

	@media (max-width: 480px) {
		.books-grid-container {
			grid-template-columns: 1fr;
			gap: 15px;
		}
	}
</style>
