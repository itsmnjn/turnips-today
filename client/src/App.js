import React, { useState, useEffect } from 'react'

import NookBoard from './components/NookBoard'
import DaisyBoard from './components/DaisyBoard'
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

	// disable button if browser does not support push notifications
	return (
		<div className="container">
			<h1 className="header-text">Turnips.Today</h1>
			<h3 className="header-text">Quickly get to those turnips, today!</h3>
			<h4 className="header-text">
				This site monitors{' '}
				<a
					href="https://reddit.com/r/acturnips"
					target="_blank"
					rel="noopener noreferrer"
				>
					/r/ACTurnips
				</a>{' '}
				and updates upon every new, valid price submission, holding the six most
				recent.
			</h4>
			{!('serviceWorker' in navigator && 'PushManager' in window) ? (
				<h4 className="header-text">
					Unfortunately, your browser does not support push notifications.
				</h4>
			) : (
				<h4 className="header-text">
					Press the button below for push notifications (requires Chrome on
					Android or PC/Mac/Linux)
				</h4>
			)}
			{!('serviceWorker' in navigator && 'PushManager' in window) ? (
				<button
					className="disabled-button"
					type="button"
					onClick={() => {
						if (!isSubscribed) {
							subscribeUserToPush(setIsSubscribed)
						} else {
							unsubscribeUserToPush(setIsSubscribed)
						}
					}}
					disabled={
						!('serviceWorker' in navigator && 'PushManager' in window)
							? true
							: false
					}
				>
					{!isSubscribed ? (
						<h4 className="button-text">Subscribe</h4>
					) : (
						<h4 className="button-text">Unsubscribe</h4>
					)}
				</button>
			) : (
				<button
					type="button"
					onClick={() => {
						if (!isSubscribed) {
							subscribeUserToPush(setIsSubscribed)
						} else {
							unsubscribeUserToPush(setIsSubscribed)
						}
					}}
					disabled={
						!('serviceWorker' in navigator && 'PushManager' in window)
							? true
							: false
					}
				>
					{!isSubscribed ? (
						<h4 className="button-text">Subscribe</h4>
					) : (
						<h4 className="button-text">Unsubscribe</h4>
					)}
				</button>
			)}
			<div className="board-container">
				<h2>From the Nook twins</h2>
				<NookBoard />
				<h2>From Daisy</h2>
				<DaisyBoard />
			</div>
			<p className="footnote">
				Made with{' '}
				<span role="img" aria-label="heart">
					❤️
				</span>{' '}
				by{' '}
				<a href="https://mnjn.me" target="_blank" rel="noopener noreferrer">
					@mnjn
				</a>
			</p>
		</div>
	)
}

export default App
