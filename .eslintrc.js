module.exports = {
	extends: [ "leankit" ],
	overrides: [
		{
			files: [ "spec/**/*.js" ],
			extends: [ "leankit/test" ]
		}
	]
}
