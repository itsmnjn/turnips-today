const api = require('./api')

test('adds 1 and 2 to equal 3', () => {
	expect(api.sum(1, 2)).toBe(3)
})
