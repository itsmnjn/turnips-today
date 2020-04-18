import React from 'react'

import { apiURI } from './constants'

function App() {
	return (
		<div>
			<h1>TurnipsToday</h1>
			<p>API URI is: {apiURI}</p>
			<p>ENV is: {process.env.ENV}</p>
		</div>
	)
}

export default App
