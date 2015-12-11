var _ = require( "lodash" );

var middleware = function( meta, hyped ) {
	var paths = {};
	var response = {
		swagger: "2.0",
		basePath: meta.apiRoot,
		info: {
			version: meta.version,
			title: meta.title || "",
			description: meta.description || "",
			termsOfService: meta.tos || "",
			contact: meta.contact || {},
			license: meta.license || {}
		}
	};

	return function( req, res, next ) {
		var links = hyped.fullOptionModels[ req.params.version ]._links;

		Object.keys( links ).forEach( function( key ) {
			var resource = links[ key ];

			paths[ resource.href ] = {};
			paths[ resource.href ][ resource.method.toLowerCase() ] = {
				tags: [ key.split( ":" )[ 0 ] ],
				operationId: key,
				description: "", // TODO: figure out how to get description information from the resource definition to here
				parameters: {},
				responses: {}
			};
		} );

		response.paths = paths;

		res.json( response );
	};
};

module.exports = middleware;
