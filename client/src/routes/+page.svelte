<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { type ColoringBook, ColoringBookApi } from '$lib/entities/coloringBookApi';
	import { type BookCompletionSummary, UserProgressApi } from '$lib/entities/userProgressApi';
	import Menu from '$lib/components/Menu.svelte';
	import '$lib/app.css';
	import { user } from '$lib/stores/userState';

	let coloringBooks: ColoringBook[] = $state([]);
	let bookCompletionSummary: BookCompletionSummary[] = $state([]);
	let isLoading: boolean = $state(true);
	let error = $state('');

	let completionMap = $derived.by(() => {
		const map = new Map<number, BookCompletionSummary>();
		bookCompletionSummary.forEach((summary) => {
			map.set(summary.bookId, summary);
		});
		return map;
	});

	onMount(async () => {
		try {
			coloringBooks = await ColoringBookApi.getColoringBooks();
			const currentUser = $user;
			if (currentUser) {
				try {
					bookCompletionSummary = await UserProgressApi.getUserBookCompletionSummary(
						currentUser.id
					);
				} catch (err) {
					console.error('Failed to fetch book completion summary', err);
				}
			}
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

	function getBookCompletionPercentage(bookId: number): number {
		const summary = completionMap.get(bookId);
		return summary ? summary.completionPercentage : 0;
	}
</script>

<div class="main-page-container">
	<Menu />
	<main class="main-page-content">
		<div class="books-grid-container">
			{#each coloringBooks as book (book.id)}
				{@const bookProgress = $user ? getBookCompletionPercentage(book.id) : 0}
				<div class="book-card" onclick={() => handleBookClick(book.id)}>
					<div class="book-cover">
						<img
							class="cover-bw"
							src={`${import.meta.env.VITE_API_BASE_URL}/assets/coloring-books/${book.id}/cover.jpg`}
							alt={book.title}
							loading="lazy"
						/>
						{#if $user && bookProgress > 0}
							<div class="cover-colored" style="--progress-width: {bookProgress}%;">
								<img
									src={`${import.meta.env.VITE_API_BASE_URL}/assets/coloring-books/${book.id}/cover.jpg`}
									alt={book.title}
									loading="lazy"
								/>
							</div>
						{/if}
						{#if $user && bookProgress === 100}
							<div class="completion-badge">
								<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path
										d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
										fill="white"
									/>
								</svg>
							</div>
						{/if}
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
		height: 280px;
		overflow: hidden;
		position: relative;
	}

	.cover-bw {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(100%);
	}

	.cover-colored {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		overflow: hidden;
		clip-path: inset(0 calc(100% - var(--progress-width, 0%)) 0 0);
	}

	.cover-colored img {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
