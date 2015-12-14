var _ = require( "lodash" );
var skeemas = require( "skeemas" );
var swaggerSchema = require( "./index.schema" );
var path = require( "path" );
var defaultAccepts = [ "application/json" ];
var defaultMediaTypes = [ "application/json", "application/hal+json", "application/hal.v1+json" ];

var swaggerTools = require( "swagger-tools" );
var swaggerValidator = swaggerTools.specs.v2.validators[ 'schema.json' ];

function patchAnyOfNullable( schemaPart ) {
	if ( !_.isPlainObject( schemaPart ) ) {
		return schemaPart;
	}

	return _.mapValues( schemaPart, function ( val, key ) {
		if ( val && val.hasOwnProperty( "anyOf" ) && val.anyOf.length === 2 ) {
			var nullObj = _.findIndex( val.anyOf, { type: "null" } );
			if ( nullObj > -1 ) {
				val = val.anyOf[ nullObj === 0 ? 1 : 0 ];
				val[ "x-isnullable" ] = true;
			}
		}

		if ( _.isPlainObject( val ) ) {
			return patchAnyOfNullable( val );
		}

		if ( _.isArray( val ) ) {
			return _.map( val, patchAnyOfNullable);
		}

		return val;
	} );
}


function prepareCachedResponses( meta, hyped ) {
	var versions = {};

	Object.keys( hyped.fullOptionModels ).forEach( function ( versionKey ) {
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

		var links = hyped.fullOptionModels[ versionKey ]._links;
		var tags = [];
		var schemas = [];

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

			if ( docs.schema ) {
				schemas.push( patchAnyOfNullable( _.cloneDeep( docs.schema ) ) );
			}

			paths[ resource.href ] = paths[ resource.href ] || {};
			paths[ resource.href ][ resource.method.toLowerCase() ] = {
				tags: [ parent ? parent : tag ],
				operationId: key,
				description: docs.description || "",
				summary: docs.summary || "",
				parameters: docs.parameters || [],
				responses: docs.responses || {
					default: {
						description: "No documentation available"
					}
				},
				consumes: docs.consumes || defaultAccepts,
				produces: docs.produces || defaultMediaTypes
			};
		} );

		var definitions = {};
		schemas.forEach( function ( schema ) {
			_.extend( definitions, schema.source.definitions );
			definitions[ schema.name ] = _.omit( schema.source, [ "definitions", "id" ] );
		} );

		response.definitions = definitions;
		response.tags = tags;
		response.paths = paths;

		swaggerValidator.options.breakOnFirstError = true;

		var valid = swaggerValidator.validate( response, "schema.json" );

		if ( !valid ) {
			console.error( swaggerValidator.lastReport.errors[ 0 ] );
			process.exit( 1 );
		}

		versions[ versionKey ] = response;
	} );

	return versions;
}

var middleware = function( meta, hyped, log ) {
	var responses = prepareCachedResponses( meta, hyped );

	return function( req, res, next ) {
		if ( responses.hasOwnProperty( req.params.version ) ) {
			res.json( responses[ req.params.version ] );
		} else {
			res.status( 404 ).json( { message: "Could not find swagger definition for " + req.params.version } );
		}
	};
};

module.exports = middleware;
