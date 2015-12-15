module.exports = function( host ) {
	return {
		name: "user",
		docs: {
			description: "Methods related to users",
			schemas: {
				user: require( "./user.schema.js" ),
				userList: {
					type: "object",
					properties: {
						users: {
							type: "array",
							items: {
								$ref: "#/definitions/user"
							}
						}
					}
				}
			}
		},
		actions: {
			self: {
				url: "/user/{id}",
				method: "GET",
				handle: function( env ) {
					return { id: Number( env.params.id ) };
				},
				docs: {
					summary: "Get a single user by ID",
					parameters: [
						{
							name: "id",
							in: "path",
							description: "ID of user to fetch",
							required: true,
							type: "integer",
							format: "int64"
						}
					],
					responses: {
						200: {
							description: "Success",
							schema: {
								$ref: "#/definitions/user"
							}
						},
						404: {
							description: "User not found",
							schema: {
								type: "object",
								properties: {
									message: { type: "string" }
								}
							}
						}
					}
				}
			},
			list: {
				url: "/user",
				method: "GET",
				handle: function() {
					return [];
				},
				docs: {
					summary: "Get a list of users",
					responses: {
						200: {
							description: "Success",
							schema: {
								$ref: "userList"
							}
						}
					}
				}
			}
		}
	};
};
