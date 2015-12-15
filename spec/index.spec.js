require( "./helpers/setup" );
var middewareFactory = require( "../src/" );

describe( "middleware", function() {
	var instance;
	var meta = {};
	var hyped = {
		fullOptionModels: {}
	};

	before( function() {
		instance = middewareFactory( meta, hyped );
	} );

	it( "should be a valid middleware function", function() {
		instance.should.be.a( "function" );
	} );
} );
