const snoowrap = require('snoowrap')
const rethinkdb = require('rethinkdb')

const reddit = new snoowrap({
	userAgent: 'TurnipsToday',
	clientId: process.env.REDDIT_CLIENT_ID,
	clientSecret: process.env.REDDIT_CLIENT_SECRET,
	refreshToken: process.env.REDDIT_REFRESH_TOKEN,
})

let monitor = null

const initializeDatabase = async (dbConnection) => {
	console.log('Initializing database...')
	const initialPriceObj = {
		title: 'initial',
		price: 0,
		datetime: new Date(Date.now()),
		url: 'http://turnips.today',
	}

	rethinkdb
		.tableCreate('nookPrices')
		.run(dbConnection)
		.catch(async (err) => {
			console.log('nookPrices already exists!')
			let isNookEmpty = await rethinkdb
				.table('nookPrices')
				.isEmpty()
				.run(dbConnection)
			if (isNookEmpty) {
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
			}
		})
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
		})

	rethinkdb
		.tableCreate('daisyPrices')
		.run(dbConnection)
		.catch(async (err) => {
			console.log('daisyPrices already exists!')
			let isDaisyEmpty = await rethinkdb
				.table('daisyPrices')
				.isEmpty()
				.run(dbConnection)
			if (isDaisyEmpty) {
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
			}
		})
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
		})
}

const emptyDatabase = async (dbConnection) => {
	const tableList = await rethinkdb.tableList().run(dbConnection)
	for (let table of tableList) {
		rethinkdb
			.tableDrop(table)
			.run(dbConnection)
			.then((result) => console.log(result))
			.catch((err) => console.log(err))
	}
}

const startMonitor = (dbConnection) => {
	console.log('Monitoring /r/ACTurnips')
	monitor = setInterval(async () => {
		const listing = await reddit.getSubreddit('acturnips').getNew()

		const title = listing[0].title.toLowerCase()
		const url = listing[0].url
		const currentDateTime = new Date(listing[0].created_utc * 1000)

		if (!title.includes('[LF]')) {
			let numbers = title.match(/\d+/g)
			if (title.includes('nook') && numbers) {
				numbers = numbers.map(Number)
				const mostLikelyPrice = Math.max(...numbers)

				const newDocument = {
					title,
					url,
					price: mostLikelyPrice,
					datetime: currentDateTime,
				}

				let latestDocument = await rethinkdb
					.table('nookPrices')
					.max('datetime')
					.run(dbConnection)

				if (newDocument.url !== latestDocument.url) {
					rethinkdb
						.table('nookPrices')
						.insert(newDocument)
						.run(dbConnection, (err, result) => {
							if (err) throw err
							console.log('Inserted new document into nookPrices', newDocument)
						})
				}
			} else if (title.includes('daisy') && numbers) {
				const numbers = title.match(/\d+/g).map(Number)
				const mostLikelyPrice = Math.max(...numbers)

				const newDocument = {
					title,
					url,
					price: mostLikelyPrice,
					datetime: currentDateTime,
				}

				let latestDocument = await rethinkdb
					.table('daisyPrices')
					.max('datetime')
					.run(dbConnection)

				if (newDocument.url !== latestDocument.url) {
					rethinkdb
						.table('daisyPrices')
						.insert(newDocument)
						.run(dbConnection, (err, result) => {
							if (err) throw err
							console.log('Inserted new document into daisyPrices', newDocument)
						})
				}
			}
		}
	}, 1000)
}

const endMonitor = () => {
	if (monitor) clearInterval(monitor)
}

module.exports = { initializeDatabase, emptyDatabase, startMonitor, endMonitor }
