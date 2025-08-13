export function registerServiceWorker() {
	if ('serviceWorker' in navigator) {
		
		// immediate registration
		navigator.serviceWorker
			.register('/sw.js')
			.catch((registrationError) => {
				console.error('Immediate registration failed: ', registrationError);
				
				// Fallback to load event
				window.addEventListener('load', () => {
					console.log('Trying registration after load event...');
					navigator.serviceWorker
						.register('/sw.js')
						.then((registration) => {
							console.log('Brush SW registered after load: ', registration);
						})
						.catch((error) => {
							console.error('Registration after load also failed: ', error);
						});
				});
			});
	} else {
		console.log('Service Worker is not supported in this browser');
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