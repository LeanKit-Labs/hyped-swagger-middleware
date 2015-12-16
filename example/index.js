var path = require( "path" );

var apiMetadata = {
	basePath: "/",
	info: {
		version: "1.0.0",
		title: "Hyped API",
		description: "Our api",
		termsOfService: "http://example.com/terms_of_service",
		contact: {
			name: "John Doe",
			email: "john.doe@example.com",
			url: "http://example.com"
		},
		license: {
			name: "Commercial",
			url: "http://example.com/license"
		}
	}
};

var autohost = require( "autohost" );
var hyped = require( "hyped" )( true, true );
var swaggerMiddleware = require( "../src/" );
var host = hyped.createHost( autohost, {
		resources: path.join( __dirname, "resource" )
		// regular autohost configuration goes here
	},
	function() {
		host.http.middleware(
			"/api/swagger/:version/swagger.json",
			swaggerMiddleware( apiMetadata, hyped )
		);
		host.start();
	}
);
