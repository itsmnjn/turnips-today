const snoowrap = require('snoowrap')
const rethinkdb = require('rethinkdb')
const websocket = require('ws')

const reddit = new snoowrap({
	userAgent: 'TurnipsToday',
	clientId: process.env.REDDIT_CLIENT_ID,
	clientSecret: process.env.REDDIT_CLIENT_SECRET,
	refreshToken: process.env.REDDIT_REFRESH_TOKEN,
})

let monitor = null
let wsGlobal = null

const initDatabase = async (dbConnection) => {
	console.log('Initializing database...')
	const initialPriceObj = {
		title: 'initial',
		price: 0,
		datetime: new Date(Date.now()),
		url: 'http://turnips.today',
	}

	rethinkdb
		.tableCreate('nookPrices', { primaryKey: 'url' })
		.run(dbConnection)
		.then((result) => {
			rethinkdb
				.table('nookPrices')
				.insert(initialPriceObj)
				.run(dbConnection)
				.then((result) => {
					console.log(result)
				})
				.catch((err) => {
					throw err
				})

			rethinkdb
				.table('nookPrices')
				.indexCreate('datetime')
				.run(dbConnection)
				.catch(console.log)

			rethinkdb
				.table('nookPrices')
				.changes()
				.run(dbConnection)
				.then((cursor) => {
					cursor.each((err, row) => {
						updateClientNewPrice(err, row, 'nook')
						console.log('updated nook')
					})
				})
				.catch((err) => {
					throw err
				})
		})
		.catch(async (err) => {
			console.log('nookPrices already exists!')
			rethinkdb
				.table('nookPrices')
				.changes()
				.run(dbConnection)
				.then((cursor) => {
					cursor.each((err, row) => {
						updateClientNewPrice(err, row, 'nook')
						console.log('updated nook')
					})
				})
				.catch((err) => {
					throw err
				})
		})

	rethinkdb
		.tableCreate('daisyPrices', { primaryKey: 'url' })
		.run(dbConnection)
		.then((result) => {
			rethinkdb
				.table('daisyPrices')
				.insert(initialPriceObj)
				.run(dbConnection)
				.then((result) => {
					console.log(result)
				})
				.catch((err) => {
					throw err
				})

			rethinkdb
				.table('daisyPrices')
				.indexCreate('datetime')
				.run(dbConnection)
				.catch(console.log)

			rethinkdb
				.table('daisyPrices')
				.changes()
				.run(dbConnection)
				.then((cursor) => {
					cursor.each((err, row) => {
						updateClientNewPrice(err, row, 'daisy')
						console.log('updated daisy')
					})
				})
				.catch((err) => {
					throw err
				})
		})
		.catch(async (err) => {
			console.log('daisyPrices already exists!')
			rethinkdb
				.table('daisyPrices')
				.changes()
				.run(dbConnection)
				.then((cursor) => {
					cursor.each((err, row) => {
						updateClientNewPrice(err, row, 'daisy')
						console.log('updated daisy')
					})
				})
				.catch((err) => {
					throw err
				})
		})
}

const emptyDatabase = async (dbConnection) => {
	const tableList = await rethinkdb.tableList().run(dbConnection)
	for (let table of tableList) {
		rethinkdb
			.tableDrop(table)
			.run(dbConnection)
			.then((result) => console.log(result))
			.catch(console.log)
	}
}

const startMonitor = (dbConnection) => {
	console.log('Monitoring /r/ACTurnips')
	monitor = setInterval(async () => {
		const listing = await reddit.getSubreddit('acturnips').getNew()

		const title = listing[0].title.toLowerCase()
		const url = listing[0].url
		const currentDateTime = new Date(Date.now())

		if (!title.includes('[LF]')) {
			let numbers = title.match(/\d+/g)
			if ((title.includes('nook') || title.includes('twin')) && numbers) {
				numbers = numbers.map(Number)
				const mostLikelyPrice = Math.max(...numbers)

				if (mostLikelyPrice > 100) {
					const newDocument = {
						title,
						url,
						price: mostLikelyPrice,
						datetime: currentDateTime,
					}

					rethinkdb
						.table('nookPrices')
						.get(url)
						.run(dbConnection)
						.then((result) => {
							if (!result) {
								rethinkdb
									.table('nookPrices')
									.insert(newDocument)
									.run(dbConnection, (err, result) => {
										if (err) throw err
										console.log(
											'Inserted new document into nookPrices',
											newDocument.url
										)
									})
							}
						})
						.catch(console.log)
				}
			} else if (title.includes('dais') && numbers) {
				const numbers = title.match(/\d+/g).map(Number)
				const mostLikelyPrice = Math.max(...numbers)

				if (mostLikelyPrice > 100) {
					const newDocument = {
						title,
						url,
						price: mostLikelyPrice,
						datetime: currentDateTime,
					}

					rethinkdb
						.table('daisyPrices')
						.get(url)
						.run(dbConnection)
						.then((result) => {
							if (!result) {
								rethinkdb
									.table('daisyPrices')
									.insert(newDocument)
									.run(dbConnection, (err, result) => {
										if (err) throw err
										console.log(
											'Inserted new document into daisyPrices',
											newDocument.url
										)
									})
							}
						})
						.catch(console.log)
				}
			}
		}
	}, 1000)
}

const endMonitor = () => {
	if (monitor) clearInterval(monitor)
}

const initWebSocketServer = () => {
	const wss = new websocket.Server({ port: 8081 })
	wss.on('connection', (ws) => {
		wsGlobal = ws

		wsGlobal.on('message', (message) => {
			console.log(`received: ${message}`)
		})
	})
}

const updateClientNewPrice = (err, row, tableName) => {
	if (err) throw err

	const newSubmission = row.new_val

	if (wsGlobal) {
		console.log('sending new submission')
		wsGlobal.send(JSON.stringify([tableName, newSubmission]))
	} else {
		console.log('WebSocket connection not established.')
	}
}

const sendAllSubmissions = async (res, dbConnection, tableName) => {
	console.log(`sending all ${tableName} submissions`)
	rethinkdb
		.table(tableName)
		.orderBy({ index: rethinkdb.desc('datetime') })
		.run(dbConnection)
		.then((cursor) => {
			cursor.toArray().then((submissions) => {
				res.json(submissions)
			})
		})
		.catch(console.log)
}

module.exports = {
	initDatabase,
	emptyDatabase,
	startMonitor,
	endMonitor,
	initWebSocketServer,
	sendAllSubmissions,
}
