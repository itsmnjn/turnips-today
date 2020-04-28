import React, { useState, useEffect } from 'react'

import { apiURI, wsURI } from '../constants'

let data = null

// manage socket connections so that unexpected closes/errors are handled
const initializeSocket = (socketObj, initialData, setSubmissions) => {
	if (!socketObj.socket) {
		socketObj.socket = new WebSocket(wsURI)

		socketObj.socket.addEventListener('open', (event) => {
			console.log('Socket opened')
			socketObj.socket.send('hi from client')
		})

		socketObj.socket.addEventListener('message', (event) => {
			const jsonConverted = JSON.parse(event.data)
			const messageType = jsonConverted[0]
			const message = jsonConverted[1]

			console.log('received message:', jsonConverted)

			if (messageType === 'daisy') {
				if (!data) {
					data = initialData
				}

				console.log('setting submissions')
				const newData = [message, ...data]
				newData.pop()
				setSubmissions(newData)
				data = newData
			}
		})

		socketObj.socket.addEventListener('close', (event) => {
			console.log('Socket closed, reopening')
			socketObj.socket = null
			setTimeout(() => {
				initializeSocket(socketObj)
			}, 2500)
		})

		socketObj.socket.addEventListener('error', (event) => {
			console.log('Socket closed because of error, reopening')
			socketObj.socket = null
			setTimeout(() => {
				initializeSocket(socketObj)
			}, 2500)
		})
	}
}

const DaisyBoard = (props) => {
	const [submissions, setSubmissions] = useState([])
	let socketObj = { socket: null }

	useEffect(() => {
		fetch(`${apiURI}daisyPrices`)
			.then((response) => {
				return response.json()
			})
			.then((initialData) => {
				setSubmissions(initialData)
				initializeSocket(socketObj, initialData, setSubmissions)
			})
	}, [])

	return (
		<div>
			<ul>
				{submissions.map((submission) => (
					<li key={submission.url}>
						{submission.title} - {submission.price} -{' '}
						<a target="_blank" rel="noopener noreferrer" href={submission.url}>
							URL
						</a>
					</li>
				))}
			</ul>
		</div>
	)
}

export default DaisyBoard