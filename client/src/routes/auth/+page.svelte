<script lang="ts">
	import '$lib/app.css';
	import '$lib/icons';
	import { crossfade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { AuthApi } from '$lib/entities/authApi';
	import { authStore } from '$lib/stores/userState';
	import { goto } from '$app/navigation';
	import { AxiosError } from 'axios';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	// User inputs state

	let email = $state('');
	let password = $state('');
	let username = $state('');
	let loading = $state(false);
	let error = $state('');

	// Client-side password validation

	let isValidPasswordLength = $derived(password.length >= 8 && password.length <= 128);
	let passwordHasUppercase = $derived(/[A-Z]/.test(password));
	let passwordHasLowercase = $derived(/[a-z]/.test(password));
	let passwordHasNumber = $derived(/\d/.test(password));

	let isFormValid = $derived(
		isValidPasswordLength && passwordHasUppercase && passwordHasLowercase && passwordHasNumber
	);

	let showPassword = $state(false);

	// Slideshow variables & animation

	let currentIndex = $state(0);
	let interval = 5000;
	let images = [
		'/assets/slideshow/slide-1.jpg',
		'/assets/slideshow/slide-2.jpg',
		'/assets/slideshow/slide-3.jpg',
		'/assets/slideshow/slide-4.jpg',
		'/assets/slideshow/slide-5.jpg'
	];

	const [send, recieve] = crossfade({
		duration: 1000,
		fallback(node, params) {
			return { duration: 1000, css: (t) => `opacity: ${t}` };
		}
	});

	// Toggling between login and signup forms

	let signUpForm = $state(true);

	const formToggle = () => {
		signUpForm = !signUpForm;
		error = '';
		email = '';
		password = '';
	};

	function handleGuestLogin() {
		authStore.loginAsGuest();
		goto('/');
	}

	// Form handlers

	const handleSignup = async (event: Event) => {
		event.preventDefault();
		loading = true;
		error = '';

		try {
			const response = await AuthApi.register({ email, password, username });
			await authStore.handleAuthSuccess(response);
			goto('/');
		} catch (err) {
			if (err instanceof AxiosError) {
				error = err.response?.data?.message || 'Registration failed. Please try again.';
			}
		} finally {
			loading = false;
		}
	};

	const handleLogin = async (event: Event) => {
		event.preventDefault();
		loading = true;
		error = '';

		try {
			const response = await AuthApi.login({ email, password });
			await authStore.handleAuthSuccess(response);
			goto('/');
		} catch (err) {
			if (err instanceof AxiosError) {
				error =
					err.response?.data?.message ||
					'Login failed. Please check your credentials and try again.';
			}
		} finally {
			loading = false;
		}
	};

	onMount(() => {
		const intervalId = setInterval(() => {
			currentIndex = (currentIndex + 1) % images.length;
		}, interval);

		return () => clearInterval(intervalId);
	});
</script>

<div class="auth-page">
	<!-- Slidesow and vignette overlay -->
	<div class="slideshow">
		{#each images as image, index (image)}
			{#if index === currentIndex}
				<div
					class="slide"
					style="background-image: url({image})"
					in:recieve={{ key: image }}
					out:send={{ key: image }}
				></div>
			{/if}
		{/each}
	</div>
	<div class="overlay"></div>

	<!-- Main form content -->

	<section class="user">
		<div class="user_options-container">
			<div class="user_options-text">
				<div class="user_options-unregistered" class:bounceLeft={!signUpForm}>
					<h2 class="user_unregistered-title">Ещё нет аккаунта?</h2>
					<p class="user_unregistered-text">
						Создайте учетную запись за 1 минуту, чтобы сохранять прогресс и пользоваться всеми
						возможностями!
					</p>
					<div class="user_unregistered-buttons">
						<button class="user_unregistered-signup" id="signup-button" onclick={formToggle}
							>Создать</button
						>
						<button class="user_unregistered-signup" id="signup-button" onclick={handleGuestLogin}
							>Гость</button
						>
					</div>
				</div>

				<div class="user_options-registered" class:bounceLeft={signUpForm}>
					<h2 class="user_registered-title">Уже есть аккаунт?</h2>
					<p class="user_registered-text">Заходите скорее, мы соскучились!</p>
					<button class="user_registered-login" id="login-button" onclick={formToggle}>Вход</button>
				</div>
			</div>

			<div
				class="user_options-forms"
				id="user_options-forms"
				class:bounceLeft={!signUpForm}
				class:bounceRight={signUpForm}
			>
				<div class="user_forms-login">
					<h2 class="forms_title">Вход</h2>
					<form class="forms_form" onsubmit={handleLogin}>
						<fieldset class="forms_fieldset">
							<div class="forms_field">
								<input
									type="email"
									placeholder="Почта"
									class="forms_field-input"
									required
									bind:value={email}
								/>
							</div>
							<div class="forms_field">
								<input
									type={showPassword ? 'text' : 'password'}
									placeholder="Пароль"
									class="forms_field-input"
									required
									bind:value={password}
								/>
								<button
									title={showPassword ? 'Скрыть' : 'Показать'}
									type="button"
									class="password-toggle"
									onclick={() => (showPassword = !showPassword)}
									>{#key showPassword}<FontAwesomeIcon
											icon={showPassword ? 'eye-slash' : 'eye'}
											fixedWidth
											class="fa-icon"
										/>{/key}</button
								>
							</div>
						</fieldset>
						{#if error}
							<div class="error-message">{error}</div>
						{/if}
						<div class="forms_buttons">
							<button type="button" class="forms_buttons-forgot">Забыли пароль?</button>
							<input type="submit" value="Войти" class="forms_buttons-action" />
						</div>
					</form>
				</div>
				<div class="user_forms-signup">
					<h2 class="forms_title">Регистрация</h2>
					<form class="forms_form" onsubmit={handleSignup}>
						<fieldset class="forms_fieldset">
							<div class="forms_field">
								<input
									type="text"
									placeholder="Имя пользователя"
									class="forms_field-input"
									required
									bind:value={username}
								/>
							</div>
							<div class="forms_field">
								<input
									type="email"
									placeholder="Почта"
									class="forms_field-input"
									required
									bind:value={email}
								/>
							</div>
							<div class="forms_field">
								<input
									type={showPassword ? 'text' : 'password'}
									placeholder="Пароль"
									class="forms_field-input"
									required
									bind:value={password}
								/>
								<button
									title={showPassword ? 'Скрыть' : 'Показать'}
									type="button"
									class="password-toggle"
									onclick={() => (showPassword = !showPassword)}
									>{#key showPassword}<FontAwesomeIcon
											icon={showPassword ? 'eye-slash' : 'eye'}
											fixedWidth
											class="fa-icon"
										/>{/key}</button
								>
							</div>
						</fieldset>
						{#if error}
							<div class="error-message">{error}</div>
						{/if}
						<div class="forms_buttons">
							<ul
								class="password-validation"
								class:valid={isValidPasswordLength &&
									passwordHasUppercase &&
									passwordHasLowercase &&
									passwordHasNumber}
							>
								В пароле есть минимум:
								<li>
									<p class="password-validation-message" class:valid={isValidPasswordLength}>
										8 символов
									</p>
								</li>
								<li>
									<p class="password-validation-message" class:valid={passwordHasUppercase}>
										одна заглавная буква
									</p>
								</li>
								<li>
									<p class="password-validation-message" class:valid={passwordHasLowercase}>
										одна строчная буква
									</p>
								</li>
								<li>
									<p class="password-validation-message" class:valid={passwordHasNumber}>
										одна цифра
									</p>
								</li>
							</ul>
							<input
								type="submit"
								value="Войти"
								class="forms_buttons-action"
								disabled={loading || !isFormValid}
							/>
						</div>
					</form>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	* {
		box-sizing: border-box;
	}

	fieldset {
		border: none;
	}

	button {
		background-color: transparent;
		padding: 0;
		border: 0;
		outline: 0;
		cursor: pointer;
	}

	input {
		background-color: transparent;
		padding: 0;
		border: 0;
		outline: 0;
	}
	input[type='submit'] {
		cursor: pointer;
	}
	input::-moz-placeholder {
		font-size: 0.85rem;
		font-family: 'Montserrat', sans-serif;
		font-weight: 300;
		letter-spacing: 0.1rem;
		color: #ccc;
	}
	input:-ms-input-placeholder {
		font-size: 0.85rem;
		font-family: 'Montserrat', sans-serif;
		font-weight: 300;
		letter-spacing: 0.1rem;
		color: #ccc;
	}
	input::placeholder {
		font-size: 0.85rem;
		font-family: 'Montserrat', sans-serif;
		font-weight: 300;
		letter-spacing: 0.1rem;
		color: #ccc;
	}

	.auth-page {
		position: relative;
		width: 100vw;
		height: 100vh;
	}

	.slideshow {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		overflow: hidden;
		z-index: 1;
	}

	.slide {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: radial-gradient(
			circle,
			rgba(0, 0, 0, 0) 0%,
			rgba(0, 0, 0, 0.1) 40%,
			rgba(0, 0, 0, 0.3) 70%,
			rgba(0, 0, 0, 0.7) 95%
		);
		z-index: 2;
	}

	.error-message {
		color: #e8716d;
		font-size: 0.85rem;
		margin-top: 10px;
		text-align: center;
	}

	.password-validation {
		color: #e8716d;
		list-style: none;
		margin: 5px 0;
		font-size: 10px;
		transition: color 0.3s ease;
	}

	.password-validation li {
		display: flex;
		align-items: center;
		margin: 5px 0;
	}

	.password-validation-message {
		margin: 0;
		padding-left: 10px;
		position: relative;
		transition: color 0.3s ease;
	}

	.password-validation-message.valid {
		color: #0cb10c;
	}

	.password-validation.valid {
		color: #0cb10c;
	}

	.password-validation-message::before {
		content: '✖';
		position: absolute;
		left: 0;
		transition: content 0.3s ease;
	}

	.password-validation-message.valid::before {
		content: '✔';
	}

	.password-toggle {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		background-color: transparent;
		border: none;
		padding: 8px;
		color: #ccc;
		transition: color 0.2s ease-in-out;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.password-toggle:hover {
		color: #999;
	}

	/* Bounce to the left side */

	@-webkit-keyframes bounceLeft {
		0% {
			transform: translate3d(100%, -50%, 0);
		}
		50% {
			transform: translate3d(-30px, -50%, 0);
		}
		100% {
			transform: translate3d(0, -50%, 0);
		}
	}
	@keyframes bounceLeft {
		0% {
			transform: translate3d(100%, -50%, 0);
		}
		50% {
			transform: translate3d(-30px, -50%, 0);
		}
		100% {
			transform: translate3d(0, -50%, 0);
		}
	}

	/* Bounce to the left side */

	@-webkit-keyframes bounceRight {
		0% {
			transform: translate3d(0, -50%, 0);
		}
		50% {
			transform: translate3d(calc(100% + 30px), -50%, 0);
		}
		100% {
			transform: translate3d(100%, -50%, 0);
		}
	}
	@keyframes bounceRight {
		0% {
			transform: translate3d(0, -50%, 0);
		}
		50% {
			transform: translate3d(calc(100% + 30px), -50%, 0);
		}
		100% {
			transform: translate3d(100%, -50%, 0);
		}
	}

	@keyframes bounceDownSwitch {
		0% {
			transform: translateY(0);
			opacity: 0.5;
		}
		40% {
			transform: translateY(30px);
			opacity: 0;
		}
		60% {
			transform: translateY(-30px);
			opacity: 0;
		}
		100% {
			transform: translateY(0);
			opacity: 1;
		}
	}

	/* Show Sign Up form */

	@-webkit-keyframes showSignUp {
		100% {
			opacity: 1;
			visibility: visible;
			transform: translate3d(0, 0, 0);
		}
	}
	@keyframes showSignUp {
		100% {
			opacity: 1;
			visibility: visible;
			transform: translate3d(0, 0, 0);
		}
	}

	/* Page background */

	.user {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100vh;
		background-size: cover;
		z-index: 3;
	}
	.user_options-container {
		position: relative;
		width: 80%;
	}
	.user_options-text {
		display: flex;
		justify-content: space-between;
		width: 100%;
		background-color: rgba(34, 34, 34, 0.85);
		border-radius: 3px;
	}

	/**
 * * Registered and Unregistered user box and text
 * */

	.user_unregistered-buttons {
		display: flex;
		justify-content: space-between;
		gap: 20px;
	}

	#signup-button {
		flex: 1;
	}

	.user_options-registered,
	.user_options-unregistered {
		width: 50%;
		padding: 75px 45px;
		color: #fff;
		font-weight: 300;
	}

	.user_registered-title,
	.user_unregistered-title {
		margin-bottom: 15px;
		font-size: 1.66rem;
		line-height: 1em;
	}

	.user_unregistered-text,
	.user_registered-text {
		font-size: 0.83rem;
		line-height: 1.4em;
	}

	.user_registered-login,
	.user_unregistered-signup {
		margin-top: 30px;
		border: 1px solid #ccc;
		border-radius: 3px;
		padding: 10px 30px;
		color: #fff;
		text-transform: uppercase;
		line-height: 1em;
		letter-spacing: 0.2rem;
		transition:
			background-color 0.2s ease-in-out,
			color 0.2s ease-in-out;
	}
	.user_registered-login:hover,
	.user_unregistered-signup:hover {
		color: rgba(34, 34, 34, 0.85);
		background-color: #ccc;
	}

	/**
 * * Login and signup forms
 * */

	.forms_field {
		position: relative;
	}

	.user_options-forms {
		position: absolute;
		padding: 30px 20px;
		top: 50%;
		left: 30px;
		width: 50%;
		min-height: 420px;
		background-color: #fff;
		border-radius: 3px;
		box-shadow: 2px 0 15px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		transform: translate3d(100%, -50%, 0);
		transition: transform 0.4s ease-in-out;
	}
	.user_options-forms .user_forms-login {
		transition:
			opacity 0.4s ease-in-out,
			visibility 0.4s ease-in-out;
	}
	.user_options-forms .forms_title {
		margin-bottom: 45px;
		font-size: 1.5rem;
		font-weight: 500;
		line-height: 1em;
		text-transform: uppercase;
		color: #e8716d;
		letter-spacing: 0.1rem;
	}
	.user_options-forms .forms_field:not(:last-of-type) {
		margin-bottom: 20px;
	}
	.user_options-forms .forms_field-input {
		width: 100%;
		border-bottom: 1px solid #ccc;
		padding: 6px 20px 6px 6px;
		font-family: 'Montserrat', sans-serif;
		font-size: 1rem;
		font-weight: 300;
		color: gray;
		letter-spacing: 0.1rem;
		transition: border-color 0.2s ease-in-out;
	}
	.user_options-forms .forms_field-input:focus {
		border-color: gray;
	}
	.user_options-forms .forms_buttons {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 35px;
	}
	.user_options-forms .forms_buttons-forgot {
		font-family: 'Montserrat', sans-serif;
		letter-spacing: 0.1rem;
		color: #ccc;
		text-decoration: underline;
		transition: color 0.2s ease-in-out;
	}
	.user_options-forms .forms_buttons-forgot:hover {
		color: #b3b3b3;
	}
	.user_options-forms .forms_buttons-action {
		background-color: #e8716d;
		border-radius: 3px;
		padding: 10px 25px;
		font-size: 1rem;
		font-family: 'Montserrat', sans-serif;
		font-weight: 300;
		color: #fff;
		text-transform: uppercase;
		letter-spacing: 0.1rem;
		transition: background-color 0.2s ease-in-out;
	}
	.user_options-forms .forms_buttons-action:hover {
		background-color: #e14641;
	}
	.user_options-forms .user_forms-signup,
	.user_options-forms .user_forms-login {
		position: absolute;
		top: 70px;
		left: 40px;
		width: calc(100% - 80px);
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.4s ease-in-out,
			visibility 0.4s ease-in-out,
			transform 0.5s ease-in-out;
	}
	.user_options-forms .user_forms-signup {
		transform: translate3d(120px, 0, 0);
	}
	.user_options-forms .user_forms-signup .forms_buttons {
		justify-content: space-between;
	}
	.user_options-forms .user_forms-login {
		transform: translate3d(0, 0, 0);
		opacity: 1;
		visibility: visible;
	}

	.forms_field-input[type='password'],
	.forms_field-input[type='text'] {
		padding-right: 40px;
	}

	/**
 * * Triggers
 * */
	.user_options-forms.bounceLeft {
		-webkit-animation: bounceLeft 1s forwards;
		animation: bounceLeft 1s forwards;
	}
	.user_options-forms.bounceLeft .user_forms-signup {
		-webkit-animation: showSignUp 1s forwards;
		animation: showSignUp 1s forwards;
	}
	.user_options-forms.bounceLeft .user_forms-login {
		opacity: 0;
		visibility: hidden;
		transform: translate3d(-120px, 0, 0);
	}
	.user_options-forms.bounceRight {
		-webkit-animation: bounceRight 1s forwards;
		animation: bounceRight 1s forwards;
	}
	.user_options-forms.bounceRight .user_forms-login {
		opacity: 1;
		visibility: visible;
		transform: translate3d(0, 0, 0);
	}
	.user_options-forms.bounceRight .user_forms-signup {
		opacity: 0;
		visibility: hidden;
		transform: translate3d(120px, 0, 0);
	}

	/**
 * * Responsive lt 768px
 * */
	@media (max-width: 768px) {
		.user_options-container {
			width: 95%;
			height: 97vh;
		}

		.user_options-text {
			flex-direction: column;
			height: auto;
		}

		.user_options-registered,
		.user_options-unregistered {
			width: 100%;
			padding: 30px 20px;
			text-align: center;
		}

		.user_options-forms {
			min-height: 260px;
			position: relative;
			top: 0;
			left: 0;
			width: 100%;
			/* height: 250px; */
			transform: none;
			margin-top: 20px;
			box-shadow: none;
		}

		/* Disable animations on mobile */
		.user_options-forms.bounceLeft,
		.user_options-forms.bounceRight {
			animation: bounceDownSwitch 0.3s ease forwards;
		}

		/* Show both forms stacked */
		.user_options-forms .user_forms-signup,
		.user_options-forms .user_forms-login {
			position: relative;
			top: 0;
			left: 0;
			width: 100%;
			transform: none;
			margin-bottom: 30px;
		}

		/* Hide one form based on state */
		.user_options-forms .user_forms-signup {
			display: none;
		}
		.user_options-forms.bounceLeft .user_forms-signup {
			display: block;
		}

		.user_options-forms .user_forms-login {
			display: none;
		}
		.user_options-forms.bounceRight .user_forms-login {
			display: block;
		}

		.user_options-unregistered.bounceLeft {
			display: none;
		}

		.user_options-registered.bounceLeft {
			display: none;
		}
	}

	@media (orientation: landscape) and (max-width: 768px) {
		.user_options-forms .forms_buttons {
			margin-top: 10px;
		}

		.user_options-container {
			height: 95vh;
		}

		.user_unregistered-title,
		.user_registered-title {
			font-size: 1rem;
		}

		.user_unregistered-text,
		.user_registered-text {
			display: none;
		}

		.user_options-registered,
		.user_options-unregistered {
			padding: 10px 20px;
		}
		#signup-button,
		#login-button {
			margin-top: 0;
		}

		.user_options-forms {
			padding: 20px 20px 0px;
			margin-top: 10px;
		}

		.user_options-forms .forms_title {
			display: none;
		}
	}
</style>
