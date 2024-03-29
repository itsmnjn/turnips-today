const snoowrap = require('snoowrap')
const rethinkdb = require('rethinkdb')
const websocket = require('ws')
const webpush = require('web-push')
const path = require('path')

const reddit = new snoowrap({
	userAgent: 'TurnipsToday',
	clientId: process.env.REDDIT_CLIENT_ID,
	clientSecret: process.env.REDDIT_CLIENT_SECRET,
	refreshToken: process.env.REDDIT_REFRESH_TOKEN,
})

let monitor = null
let wssGlobal = null

// starts up database, populates with initial value if empty,
// sets up callback function to run when changes are made to nookPrices and daisyPrices,
// creates datetime index for orderBy to be possible in monitor function
const initDatabase = async (dbConnection) => {
	console.log('Initializing database...')

	rethinkdb
		.tableCreate('subscriptions')
		.run(dbConnection)
		.catch((err) => {
			console.log('Subscriptions table already exists!')
		})

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
				.indexCreate('datetime')
				.run(dbConnection)
				.catch(console.log)

			// set up callback function to run upon every table change
			rethinkdb
				.table('nookPrices')
				.changes()
				.run(dbConnection)
				.then((cursor) => {
					cursor.each((err, row) => {
						updateClientNewPrice(err, row, 'nook', dbConnection)
						console.log('updated nook')
					})
				})
				.catch((err) => {
					throw err
				})
		})
		.catch(async (err) => {
			console.log('nookPrices already exists!')

			// set up callback function to run upon every table change
			rethinkdb
				.table('nookPrices')
				.changes()
				.run(dbConnection)
				.then((cursor) => {
					cursor.each((err, row) => {
						updateClientNewPrice(err, row, 'nook', dbConnection)
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
				.indexCreate('datetime')
				.run(dbConnection)
				.catch(console.log)

			// set up callback function to run upon every table change
			rethinkdb
				.table('daisyPrices')
				.changes()
				.run(dbConnection)
				.then((cursor) => {
					cursor.each((err, row) => {
						updateClientNewPrice(err, row, 'daisy', dbConnection)
						console.log('updated daisy')
					})
				})
				.catch((err) => {
					throw err
				})
		})
		.catch(async (err) => {
			console.log('daisyPrices already exists!')

			// set up callback function to run upon every table change
			rethinkdb
				.table('daisyPrices')
				.changes()
				.run(dbConnection)
				.then((cursor) => {
					cursor.each((err, row) => {
						updateClientNewPrice(err, row, 'daisy', dbConnection)
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

// monitors /r/acturnips subreddit for new posts every
// 5 seconds containing indiciative words for either nook or daisy prices
const startMonitor = (dbConnection) => {
	console.log('Monitoring /r/ACTurnips')
	monitor = setInterval(async () => {
		const newListing = await reddit.getSubreddit('acturnips').getNew()

		for (let i = newListing.length - 1; i >= 0; i--) {
			const submission = newListing[i]

			const title = submission.title.toLowerCase()
			const url = submission.url
			const currentDateTime = new Date(Date.now())

			if (!title.includes('[LF]')) {
				let numbers = title.match(/\d+/g)
				if (
					(title.includes('nook') ||
						title.includes('twin') ||
						title.includes('tim') ||
						title.includes('tom') ||
						title.includes('boi') ||
						title.includes('boy')) &&
					numbers
				) {
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
									// check the amount of documents in the table
									rethinkdb
										.table('nookPrices')
										.count()
										.run(dbConnection)
										.then((count) => {
											if (count > 128) {
												// delete the oldest document
												return rethinkdb
													.table('nookPrices')
													.orderBy({ index: 'datetime' })
													.run(dbConnection)
													.then((cursor) => {
														cursor.toArray().then((submissions) => {
															return rethinkdb
																.table('nookPrices')
																.get(submissions[0].url)
																.delete()
																.run(dbConnection)
														})
													})
											}
										})
										.catch(console.log)

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

					if (mostLikelyPrice < 150) {
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
									// check the amount of documents in the table
									rethinkdb
										.table('daisyPrices')
										.count()
										.run(dbConnection)
										.then((count) => {
											if (count > 128) {
												// delete the oldest document
												return rethinkdb
													.table('daisyPrices')
													.orderBy({ index: 'datetime' })
													.run(dbConnection)
													.then((cursor) => {
														cursor.toArray().then((submissions) => {
															return rethinkdb
																.table('daisyPrices')
																.get(submissions[0].url)
																.delete()
																.run(dbConnection)
														})
													})
											}
										})
										.catch(console.log)

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
		}
	}, 5000)
}

const endMonitor = () => {
	if (monitor) clearInterval(monitor)
}

// function to be applied inside a callback belonging to a 'ws' object,
// thus 'this' is used to reference that object
function heartbeat() {
	this.isAlive = true
}

const initWebSocketServer = () => {
	// global wss needed for data transmission in other areas of API
	wssGlobal = new websocket.Server({ port: 8081 })

	wssGlobal.on('connection', (ws) => {
		ws.isAlive = true
		ws.on('pong', heartbeat)
		ws.on('message', (message) => {
			console.log('Received:', message)
			console.log('Sending WS hello message to client')
			ws.send(JSON.stringify(['message', 'hello from server']))
		})
		ws.on('close', () => {
			console.log('Client closed')
		})
	})

	// ping WebSocket client every 30 seconds, terminate if not alive
	const interval = setInterval(function ping() {
		wssGlobal.clients.forEach((ws) => {
			if (ws.isAlive === false) return ws.terminate()

			ws.isAlive = false
			ws.ping(() => {})
		})
	}, 30000)

	wssGlobal.on('close', function close() {
		clearInterval(interval)
	})
}

// update function, runs when new submission is entered into database
const updateClientNewPrice = (err, row, tableName, dbConnection) => {
	if (err) throw err

	const newSubmission = row.new_val

	if (wssGlobal) {
		console.log('Sending new submission')
		wssGlobal.clients.forEach((client) => {
			if (client.readyState === websocket.OPEN) {
				client.send(JSON.stringify([tableName, newSubmission]))
			}
		})
	} else {
		console.log('WebSocket connection not established.')
	}

	console.log('Sending push notifications')
	sendPush(newSubmission, tableName, dbConnection)
}

// sends up to 10 submissions to HTTP client
const sendAllSubmissions = async (res, dbConnection, tableName) => {
	console.log(`Sending all ${tableName} submissions`)
	rethinkdb
		.table(tableName)
		.orderBy({ index: rethinkdb.desc('datetime') })
		.limit(6)
		.run(dbConnection)
		.then((cursor) => {
			cursor.toArray().then((submissions) => {
				res.json(submissions)
			})
		})
		.catch(console.log)
}

const saveSubscriptionToDatabase = (subscription, dbConnection) => {
	return rethinkdb
		.table('subscriptions')
		.insert(subscription)
		.run(dbConnection)
		.catch((err) => {
			throw err
		})
}

const isValidSubscription = (req, res) => {
	// Check the request body has at least an endpoint.
	console.log('Checking if valid subscription')
	if (!req.body || !req.body.endpoint) {
		// Not a valid subscription.
		res.status(400)
		res.setHeader('Content-Type', 'application/json')
		res.send(
			JSON.stringify({
				error: {
					id: 'no-endpoint',
					message: 'Subscription must have an endpoint.',
				},
			})
		)
		return false
	}
	return true
}

const pushSubscription = (req, res, dbConnection) => {
	console.log('Saving subscription to back-end')
	if (!isValidSubscription(req, res)) {
		console.log('Not valid subscription')
		return
	}

	console.log('Saving subscription to database')
	saveSubscriptionToDatabase(req.body, dbConnection)
		.then((result) => {
			console.log('Success saving subscription')
			const primaryKey = result.generated_keys[0]
			res.setHeader('Content-Type', 'application/json')
			res.send(JSON.stringify({ primaryKey }))
		})
		.catch((err) => {
			console.log('Unable to save subscription')
			console.log(err)
			res.status(500)
			res.setHeader('Content-Type', 'application/json')
			res.send(
				JSON.stringify({
					error: {
						id: 'unable-to-save-subscription',
						message:
							'The subscription was received but we were unable to save it to our database.',
					},
				})
			)
		})
}

const pullSubscription = (req, res, dbConnection) => {
	console.log('Pulling subscription')
	const primaryKey = req.body.primaryKey
	rethinkdb
		.table('subscriptions')
		.get(primaryKey)
		.delete()
		.run(dbConnection)
		.then((result) => {
			res.setHeader('Content-Type', 'application/json')
			res.send(JSON.stringify({ success: true }))
			console.log('Subscription successfully pulled')
		})
		.catch((err) => {
			res.status(500)
			res.setHeader('Content-Type', 'application/json')
			res.send(JSON.stringify({ success: false }))
			console.log(err)
		})
}

const getSubscriptionsFromDatabase = (dbConnection) => {
	return rethinkdb
		.table('subscriptions')
		.run(dbConnection)
		.then((cursor) => {
			return cursor.toArray()
		})
		.catch(console.log)
}

const deleteSubscriptionFromDatabase = (id, dbConnection) => {
	return rethinkdb
		.table('subscriptions')
		.get(id)
		.delete()
		.run(dbConnection)
		.catch((err) => {
			throw err
		})
}

const triggerPushMsg = (subscription, dataToSend, dbConnection) => {
	return webpush.sendNotification(subscription, dataToSend).catch((err) => {
		if (err.statusCode === 404 || err.statusCode === 410) {
			console.log('Subscription has expired or is no longer valid: ', err)
			return deleteSubscriptionFromDatabase(subscription.id, dbConnection)
		} else {
			throw err
		}
	})
}

const sendPush = (submission, tableName, dbConnection) => {
	webpush.setVapidDetails(
		'mailto:mk7pe@virginia.edu',
		process.env.VAPID_PUBLIC_KEY,
		process.env.VAPID_PRIVATE_KEY
	)

	const dataToSend = {
		title: '',
		message: '',
		url: submission.url,
	}

	if (tableName === 'nook') {
		dataToSend.title = `${submission.price} bells from the Nook twins!`
	} else {
		dataToSend.title = `${submission.price} bells from Daisy!`
	}

	dataToSend.message = 'Click me to go to the post.'

	// for all subscriptions in database, send a push notification
	getSubscriptionsFromDatabase(dbConnection)
		.then((subscriptions) => {
			let promiseChain = Promise.resolve()

			console.log('Starting subscriptions chain')
			for (let i = 0; i < subscriptions.length; i++) {
				const subscription = subscriptions[i]
				console.log('Sending to enpoint: ', subscription.endpoint)
				promiseChain = promiseChain.then(() => {
					return triggerPushMsg(
						subscription,
						JSON.stringify(dataToSend),
						dbConnection
					)
				})
			}

			return promiseChain
		})
		.then(() => {
			console.log('Sent push to all subscriptions')
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
	pushSubscription,
	pullSubscription,
}
