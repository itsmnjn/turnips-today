require('dotenv').config()

const express = require('express')
const cors = require('cors')
const rethinkdb = require('rethinkdb')

const server = express()
const port = 8000

const api = require('./api')

server.use(cors())

rethinkdb
	.connect({
		host: 'localhost',
		port: 28015,
	})
	.then((dbConnection) => {
		setTimeout(() => {
			api.initDatabase(dbConnection)
		}, 100)
		setTimeout(() => {
			api.startMonitor(dbConnection)
		}, 200)
		// api.emptyDatabase(dbConnection)

		server.get('/nookPrices', (req, res) => {
			api.sendAllSubmissions(res, dbConnection, 'nookPrices')
		})

		server.get('/daisyPrices', (req, res) => {
			api.sendAllSubmissions(res, dbConnection, 'daisyPrices')
		})
	})
	.catch((err) => {
		throw err
	})

api.initWebSocketServer()

server.get('/', (req, res) => res.send('Hello world!'))

server.listen(port, () =>
	console.log(`App listening at http://localhost:${port}`)
)
