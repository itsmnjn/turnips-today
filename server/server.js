require('dotenv').config()

const express = require('express')
const cors = require('cors')
const rethinkdb = require('rethinkdb')
const bodyParser = require('body-parser')

const server = express()
const port = 8000

const api = require('./api')

server.use(cors())
server.use(bodyParser.json())

rethinkdb
	.connect({
		host: 'localhost',
		port: 28015,
	})
	.then((dbConnection) => {
		// setTimeout so that monitor is guaranteed to start after
		// // database initialization
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

		server.post('/pushSubscription', (req, res) => {
			api.pushSubscription(req, res, dbConnection)
		})

		server.post('/pullSubscription', (req, res) => {
			api.pullSubscription(req, res, dbConnection)
		})
	})
	.catch((err) => {
		throw err
	})

api.initWebSocketServer()

server.listen(port, () =>
	console.log(`App listening at http://localhost:${port}`)
)
