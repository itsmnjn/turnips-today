const apiURI = 'http://localhost:8000/'

const urlBase64ToUint8Array = (base64String) => {
	var padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

	var rawData = window.atob(base64)
	var outputArray = new Uint8Array(rawData.length)

	for (var i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}

self.addEventListener('push', (event) => {
	const data = event.data.json()
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.message,
			data: data.url,
			icon: 'bellbag.png',
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

self.addEventListener('pushsubscriptionchange', (event) => {
	const publicKey =
		'BKl-l1NY8Mdg97oWeMgfvC4NLyKYF90mhOCn-ojrarudHv7XdJmmGzlev3Ziq9p2jWlfY4lsLqVe4q50Gl-6LZg'
	const subscribeOptions = {
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(publicKey),
	}

	console.log('Subscription expired, subscribing anew')

	event.waitUntil(
		self.registration.pushManager
			.subscribe(subscribeOptions)
			.then((subscription) => {
				console.log('Pulling old subscription', event.oldSubscription.endpoint)

				const primaryKey = window.localStorage.getItem('primaryKey')

				fetch(`${apiURI}pullSubscription`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ primaryKey }),
				}).then((response) => {
					if (!response.ok) {
						throw new Error(response)
					} else {
						console.log(
							'Successfully deleted expired subscription from database'
						)
					}
				})

				console.log('Pushing new subscription')

				fetch(`${apiURI}pushSubscription`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(event.newSubscription),
				})
					.then((response) => {
						if (!response.ok) {
							console.log(response)
							throw new Error('Bad status code from server.')
						}

						return json.response()
					})
					.then((backendResponse) => {
						window.localStorage.setItem(
							'primaryKey',
							backendResponse.primaryKey
						)
					})
			})
	)
})
