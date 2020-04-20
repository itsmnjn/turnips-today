const snoowrap = require('snoowrap')
const rethinkdb = require('rethinkdb')

const reddit = new snoowrap({
	userAgent: 'TurnipsToday',
	clientId: process.env.REDDIT_CLIENT_ID,
	clientSecret: process.env.REDDIT_CLIENT_SECRET,
	refreshToken: process.env.REDDIT_REFRESH_TOKEN,
})

let dbConnection = null
rethinkdb.connect({ host: 'localhost', port: 28015 }, (err, conn) => {
	if (err) {
		throw err
	}
	dbConnection = conn
})

const monitor = setInterval(async () => {
	const listing = await reddit.getSubreddit('acturnips').getNew()

	const title = listing[0].title.toLowerCase()
	const url = listing[0].url
	const currentDateTime = new Date(listing[0].created_utc * 1000)

	if (!title.includes('[LF]')) {
		if (title.includes('nook')) {
			const numbers = title.match(/\d+/g).map(Number)
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
		} else if (title.includes('daisy')) {
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

const sum = (a, b) => {
	return a + b
}

module.exports = { sum }
