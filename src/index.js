var _ = require( "lodash" );
var skeemas = require( "skeemas" );
var swaggerSchema = require( "./index.schema" );
var path = require( "path" );
var defaultAccepts = [ "application/json" ];
var defaultMediaTypes = [ "application/json", "application/hal+json", "application/hal.v1+json" ];

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
		var tags = [];

		Object.keys( links ).forEach( function( key ) {
			var resource = links[ key ];
			var keyParts = key.split( ":" );
			var tag = keyParts[ 0 ];
			var action = keyParts[ 1 ];
			var resourceDefinition = hyped.resources[ tag ];
			var actionDefinition = resourceDefinition.actions[ action ];
			var parent = resourceDefinition.parent;
			var docs = actionDefinition.docs || {};

			if ( !_.find( tags, { name: tag } ) && !parent ) {
				tags.push( {
					name: tag,
					description: resourceDefinition.description || ""
				} );
			}

			paths[ resource.href ] = paths[ resource.href ] || {};
			paths[ resource.href ][ resource.method.toLowerCase() ] = {
				tags: [ parent ? parent : tag ],
				operationId: key,
				description: docs.description || "",
				summary: docs.summary || "",
				parameters: docs.parameters || [],
				responses: docs.responses || [],
				consumes: docs.consumes || defaultAccepts,
				produces: docs.produces || defaultMediaTypes
			};
		} );

		response.tags = tags;
		response.paths = paths;

		// var validationResult = skeemas.validate( response, swaggerSchema );
		// if ( !validationResult.valid ) {
		// 	res.json( validationResult.errors );
		// 	return;
		// } else {
		// 	console.log( "YOU ARE VALIDATED!" );
		// }

		res.json( response );
	};
};

module.exports = middleware;
