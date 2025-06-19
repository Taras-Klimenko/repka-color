<script>
	import AudioPlayer from './AudioPlayer.svelte';
</script>

<div class="header-container">
	<header class="header">
		<div class="logo-container"><p class="logo">LOGO</p></div>
		<nav class="navigation">
			<ul>
				<li><a class="navigation__link" href="top">Истории</a></li>
			</ul>
		</nav>
		<div class="profile-container"></div>
		<AudioPlayer />
	</header>
</div>

<style>
	.header {
		display: flex;
		justify-content: space-around;
	}
</style>
