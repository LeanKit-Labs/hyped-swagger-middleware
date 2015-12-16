require( "../helpers/setup" );
var middewareFactory = require( "../../src/" );

describe( "middleware - behavior", function() {
	var instance;
	var meta = {};
	var hyped = {
		fullOptionModels: {}
	};

	describe( "when calling the factory", function() {
		before( function() {
			instance = middewareFactory( meta, hyped );
		} );

		it( "should be a valid middleware function", function() {
			instance.should.be.a( "function" );
		} );
	} );
} );
