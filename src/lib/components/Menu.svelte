<script lang="ts">
	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function hideMenu() {
		isMenuOpen = false;
	}
</script>

<div class="nav-wrapper">
	<div
		class="menu-icon"
		onclick={toggleMenu}
		role="button"
		tabindex="0"
		onkeydown={(e) => (e.key === ' ' || e.key === 'Enter') && toggleMenu()}
	>
		<div class="bar1" class:active={isMenuOpen}></div>
		<div class="bar2" class:active={isMenuOpen}></div>
		<div class="bar3" class:active={isMenuOpen}></div>
	</div>
	<nav id="nav" class:active={isMenuOpen}>
		<ul>
			<li><a href="#top" onclick={hideMenu}>Home</a></li>
			<li><a href="#top" onclick={hideMenu}>About</a></li>
			<li><a href="#top" onclick={hideMenu}>Projects</a></li>
			<li><a href="#top" onclick={hideMenu}>Contact</a></li>
		</ul>
	</nav>
	<div
		class="backdrop"
		onclick={hideMenu}
		class:visible={isMenuOpen}
		onkeydown={(e) => e.key === 'Escape' && hideMenu()}
		role="button"
		tabindex="0"
	></div>
</div>

<style>
	.menu-icon {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		cursor: pointer;
		position: fixed;
		top: 15px;
		left: 15px;
		width: 2rem;
		height: 2rem;
		z-index: 100;
	}

	.menu-icon div {
		height: 0.25rem;
		background-color: black;
		transition:
			transform 0.3s ease-in-out,
			opacity 0.3s ease-in-out;
	}

	.active.bar1 {
		transform: translateY(0.6rem) rotate(-45deg);
	}

	.active.bar2 {
		opacity: 0;
	}

	.active.bar3 {
		transform: translateY(-0.7rem) rotate(45deg);
	}

	.nav-wrapper {
		height: 60px;
		position: fixed;
		top: 0;
		left: 0;
		width: fit-content;
		z-index: 100;
	}

	nav {
		height: 100%;
		color: black;
		position: fixed;
		top: 0;
		left: 0;
		transform: translateX(-100%);
		transition: transform 0.4s ease-in-out;
		width: 33vw;
		z-index: 2;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10px);
	}

	nav ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 85%;
		font-size: 2rem;
	}

	nav a {
		text-decoration: none;
		color: black;

		&:hover {
			padding-bottom: 5px;
			border-bottom: 5px solid black;
		}
	}

	nav ul li {
		margin: 1rem 0;
	}

	nav.active {
		transform: translateX(0);
	}

	.backdrop {
		position: fixed;
		top: 0;
		left: 33vw;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.2);
		z-index: 1;
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}
	.backdrop.visible {
		opacity: 1;
		pointer-events: auto;
	}
</style>
