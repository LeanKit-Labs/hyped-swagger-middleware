module.exports = {
	description: "Schema for the response when retrieving a user",
	type: "object",
	required: [ "id", "username", "fullName" ],
	properties: {
		id: { type: "integer" },
		username: { type: "string" },
		fullName: { type: "string" }
	}
}
