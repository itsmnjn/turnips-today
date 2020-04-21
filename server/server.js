require('dotenv').config()

const express = require('express')
const rethinkdb = require('rethinkdb')

const server = express()
const port = process.env.PORT || 8000

const api = require('./api')

rethinkdb
	.connect({
		host: 'localhost',
		port: 28015,
	})
	.then((dbConnection) => {
		setTimeout(() => {
			api.initializeDatabase(dbConnection)
		}, 100)
		setTimeout(() => {
			api.startMonitor(dbConnection)
		}, 200)
		// api.emptyDatabase(dbConnection)
	})
	.catch((err) => {
		throw err
	})

server.get('/', (req, res) => res.send('Hello world!'))

server.listen(port, () =>
	console.log(`App listening at http://localhost:${port}`)
)
