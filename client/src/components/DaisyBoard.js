import React, { useState, useEffect } from 'react'

import { apiURI, wsURI } from '../constants'
import Price from './Price'

let data = null

// manage socket connections so that unexpected closes/errors are handled
const initializeSocket = (socketObj, initialData, setSubmissions) => {
	if (!socketObj.socket) {
		socketObj.socket = new WebSocket(wsURI)

		socketObj.socket.addEventListener('open', (event) => {
			socketObj.socket.send('hi from client')
		})

		socketObj.socket.addEventListener('message', (event) => {
			const jsonConverted = JSON.parse(event.data)
			const messageType = jsonConverted[0]
			const message = jsonConverted[1]

			if (messageType === 'daisy') {
				if (!data) {
					data = initialData
				}

				const newData = [message, ...data]
				if (newData.length > 6) {
					newData.pop()
				}
				try {
					setSubmissions(newData)
				} catch (err) {
					window.location.reload()
				}
				data = newData
			}
		})

		socketObj.socket.addEventListener('close', (event) => {
			socketObj.socket = null
			setTimeout(() => {
				initializeSocket(socketObj)
			}, 2500)
		})

		socketObj.socket.addEventListener('error', (event) => {
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
		<div className="board">
			{submissions.map((submission) => (
				<Price
					key={submission.url}
					price={submission.price}
					url={submission.url}
				/>
			))}
		</div>
	)
}

export default DaisyBoard
