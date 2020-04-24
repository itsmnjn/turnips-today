import React, { useState, useEffect } from 'react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

import { apiURI } from '../constants'

const CustomTooltip = ({ payload, label, active }) => {
	if (active && payload) {
		const datetimeString = payload[0].payload.datetime
		const datetime = new Date(Date.parse(datetimeString))
		return (
			<div className="custom-tooltip">
				<p className="label">{`price: ${payload[0].value}`}</p>
				<p className="desc">{datetime.toLocaleString()}</p>
			</div>
		)
	}

	return null
}

const PriceBoard = (props) => {
	const [submissions, setSubmissions] = useState([])
	const [chartData, setChartData] = useState([])
	const socket = props.socket

	useEffect(function() {
		fetch(apiURI + `${props.tableName}Prices`)
			.then((response) => {
				return response.json()
			})
			.then((data) => {
				const dataWithParsedDate = data.map((submission) => {
					let submissionWithParsedDate = submission
					submissionWithParsedDate.datetime = submissionWithParsedDate.datetime
				})
				setSubmissions(data)

				let tempChartData = []
				data.forEach((submission) => {
					tempChartData.unshift(submission)
				})

				setChartData(tempChartData)

				socket.addEventListener('message', (event) => {
					const jsonConverted = JSON.parse(event.data)
					const messageType = jsonConverted[0]
					const message = jsonConverted[1]

					if (messageType === 'message') {
						console.log(message)
					} else if (messageType === props.tableName) {
						console.log('setting submissions')
						setSubmissions([message, ...data])
						setChartData([...tempChartData, message])
					}
				})
			})
	}, [])

	return (
		<div>
			<LineChart width={600} height={300} data={chartData}>
				<Line strokeWidth={2} type="linear" dataKey="price" stroke="#202020" />
				<YAxis stroke="#303030" />
				<Tooltip content={<CustomTooltip />} />
			</LineChart>
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
