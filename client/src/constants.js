export const apiURI =
	process.env.NODE_ENV === 'production'
		? 'http://api.turnips.today/'
		: 'http://localhost:8000/'
