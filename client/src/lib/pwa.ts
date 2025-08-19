export function registerServiceWorker() {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker
				.register('/sw.js')
				.then((registration) => {
					console.log('Brush SW registered: ', registration);

					// Check for updates
					registration.addEventListener('updatefound', () => {
						console.log('New service worker available');
						const newWorker = registration.installing;

						newWorker?.addEventListener('statechange', () => {
							if (newWorker.state === 'installed') {
								console.log('New service worker installed, reloading...');
								window.location.reload();
							}
						});
					});
				})
				.catch((registrationError) => {
					console.log('Brush SW registration failed: ', registrationError);
				});
		});
	}
}

export function checkForAppUpdate() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			console.log('New service worker activated, reloading page...');
			window.location.reload();
		});
	}
}
