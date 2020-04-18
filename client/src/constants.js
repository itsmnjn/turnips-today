export const apiURI =
	process.env.ENV === 'prod'
		? 'http://api.turnips.today/'
		: 'http://localhost:8000/'
