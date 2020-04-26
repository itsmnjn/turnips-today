self.addEventListener('push', (event) => {
	const data = event.data.json()
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.message,
		})
	)
})

self.addEventListener('notificationclick', (event) => {
	const clickedNotification = event.notification
	clickedNotification.close()

	const data = event.data.json()

	if (data.url) {
		event.waitUntil(clients.openWindow(data.url))
	}
})
