<script lang="ts">
	const { count = 6 } = $props<{
		count?: number;
	}>();

	let skeletonItems = Array(count);
</script>

<div class="pages-grid">
	{#each skeletonItems as item}
		<div class="page-card">
			<div class="page-image"></div>
			<div class="page-content">
				<div class="skeleton-title"></div>
			</div>
		</div>
	{/each}
</div>

<style>
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
		backdrop-filter: blur(10px);
	}

	.page-image {
		width: 100%;
		height: 280px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.page-content {
		padding: 20px;
	}

	.skeleton-title {
		width: 80%;
		height: 20px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 4px;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	@media (max-width: 768px) {
		.pages-grid {
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
			gap: 20px;
		}

		.page-image {
			height: 240px;
		}
	}

	@media (max-width: 480px) {
		.pages-grid {
			grid-template-columns: 1fr;
			gap: 15px;
		}

		.page-image {
			height: 200px;
		}
	}
</style>