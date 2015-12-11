require( "./helpers/setup" );
var Instance = require( "../src/" );

describe( "middleware", function() {
	var instance;
	var meta = {};
	var hyped = {};

	before( function() {
		instance = new Instance( meta, hyped );
	} );

	it( "should be a valid middleware function", function() {
		instance.should.be.a( "function" );
	} );
} );
