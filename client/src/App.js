import React, { useState, useEffect } from 'react'

import PriceBoard from './components/PriceBoard'
import { apiURI } from './constants'

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

const askPermission = () => {
	return new Promise((resolve, reject) => {
		const permissionResult = Notification.requestPermission(function(result) {
			resolve(result)
		})

		if (permissionResult) {
			permissionResult.then(resolve, reject)
		}
	})
}

const unsubscribeUserToPush = (setIsSubscribed) => {
	const primaryKey = window.localStorage.getItem('primaryKey')
	fetch(`${apiURI}pullSubscription`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ primaryKey }),
	}).then((response) => {
		if (!response.ok) {
			throw new Error(response)
		} else {
			console.log('Successfully deleted subscription from database')
			console.log('Unsubscribed user successfully')
			window.localStorage.setItem('isSubscribed', 'false')
			setIsSubscribed(false)
		}
	})
}

const subscribeUserToPush = (setIsSubscribed) => {
	askPermission().then(async (permissionResult) => {
		if (permissionResult !== 'granted') {
			console.log("We weren't granted permission.")
		} else {
			console.log('Permission granted.')

			const publicKey =
				'BKl-l1NY8Mdg97oWeMgfvC4NLyKYF90mhOCn-ojrarudHv7XdJmmGzlev3Ziq9p2jWlfY4lsLqVe4q50Gl-6LZg'
			const subscribeOptions = {
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey),
			}

			navigator.serviceWorker.register('serviceWorker.js', { scope: '/' })
			navigator.serviceWorker.ready
				.then(async (registration) => {
					const subscription = await registration.pushManager.subscribe(
						subscribeOptions
					)

					console.log('Subscribe success: ', subscription)
					window.localStorage.setItem('isSubscribed', 'true')
					setIsSubscribed(true)

					console.log('Sending subscription to back-end')
					const backendResponse = await sendSubscriptionToBackEnd(subscription)
					console.log('Received response: ', backendResponse)
					window.localStorage.setItem('primaryKey', backendResponse.primaryKey)
				})
				.catch(console.error)
		}
	})
}

const sendSubscriptionToBackEnd = (subscription) => {
	return fetch(`${apiURI}pushSubscription`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(subscription),
	}).then((response) => {
		if (!response.ok) {
			console.log(response)
			throw new Error('Bad status code from server.')
		}

		return response.json()
	})
}

const App = () => {
	const [isSubscribed, setIsSubscribed] = useState(
		window.localStorage.getItem('isSubscribed') === 'true' ? true : false
	)

	return (
		<div>
			{'serviceWorker' in navigator && 'PushManager' in window ? (
				<button
					type="button"
					onClick={() => {
						if (!isSubscribed) {
							subscribeUserToPush(setIsSubscribed)
						} else {
							unsubscribeUserToPush(setIsSubscribed)
						}
					}}
				>
					{!isSubscribed
						? 'Turn on push notifications'
						: 'Turn off push notifications'}
				</button>
			) : null}
			<h1>TurnipsToday</h1>
			<h2>Nook Prices</h2>
			<PriceBoard tableName="nook" />
			<h2>Daisy Prices</h2>
			<PriceBoard tableName="daisy" />
		</div>
	)
}

export default App
