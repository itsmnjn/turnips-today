import React, { useState, useEffect } from 'react'

import { apiURI, wsURI } from '../constants'

const initializeSocket = (socketObj, tableName, data, setSubmissions) => {
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

			if (messageType === tableName) {
				console.log('setting submissions')
				setSubmissions([message, ...data])
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

const PriceBoard = (props) => {
	const [submissions, setSubmissions] = useState([])
	let socketObj = { socket: null }

	useEffect(() => {
		fetch(apiURI + `${props.tableName}Prices`)
			.then((response) => {
				return response.json()
			})
			.then((data) => {
				setSubmissions(data)

				let tempChartData = []
				data.forEach((submission) => {
					tempChartData.unshift(submission)
				})

				initializeSocket(socketObj, props.tableName, data, setSubmissions)
			})
	}, [])

	return (
		<div>
			<ul>
				{submissions.map((submission) => (
					<li key={submission.url}>
						{submission.title} - {submission.price} -{' '}
						<a href={submission.url}>URL</a>
					</li>
				))}
			</ul>
		</div>
	)
}

export default PriceBoard
