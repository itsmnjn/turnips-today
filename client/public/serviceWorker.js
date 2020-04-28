self.addEventListener('push', (event) => {
	const data = event.data.json()
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.message,
			data: data.url,
		})
	)
})

self.addEventListener('notificationclick', (event) => {
	const clickedNotification = event.notification
	clickedNotification.close()

	if (clickedNotification.data) {
		event.waitUntil(clients.openWindow(clickedNotification.data))
	}
})
