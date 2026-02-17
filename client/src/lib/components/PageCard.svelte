<script lang="ts">
	import type { ColoringBookPage } from '$lib/entities/coloringBookApi';
	import { user } from '$lib/stores/userState';
	import '$lib/app.css';
	import type { UserPageProgress, UserProgressPage } from '$lib/entities/userProgressApi';

	const {
		page,
		index,
		pageProgress,
		thumbnailUrl,
		handlePageClick = () => {}
	} = $props<{
		page: ColoringBookPage | UserProgressPage;
		index: number;
		pageProgress: number;
		thumbnailUrl: string;
		handlePageClick: () => void;
	}>();
</script>

<button type="button" class="page-card" onclick={handlePageClick}>
	<div class="page-thumbnail">
		{#if $user && pageProgress === 100}
			<div class="completion-badge">
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
				</svg>
			</div>
		{/if}
		<img class="thumbnail-bw" src={thumbnailUrl} alt={page.title} loading="lazy" />
		{#if $user && pageProgress > 0}
			<div class="thumbnail-colored" style="--progress-width: {pageProgress}%;">
				<img src={thumbnailUrl} alt={page.title} loading="lazy" />
			</div>
		{/if}
		<div class="page-overlay">
			<span class="page-number">{index}</span>
		</div>
	</div>
	<div class="page-info">
		<h3 class="page-title">{page.title}</h3>
	</div>
</button>

<style>
	.page-card {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 15px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		backdrop-filter: blur(10px);

		/* button styles reset */

		border: none;
		padding: 0;
		margin: 0;
		width: 100%;
		text-align: left;
		font-family: inherit;
		font-size: inherit;
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
</style>
