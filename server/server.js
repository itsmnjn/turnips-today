require('dotenv').config()

const express = require('express')

const server = express()
const port = process.env.PORT || 8000

const api = require('./api')

server.get('/', (req, res) => res.send('Hello world!'))

server.listen(port, () =>
	console.log(`App listening at http://localhost:${port}`)
)
