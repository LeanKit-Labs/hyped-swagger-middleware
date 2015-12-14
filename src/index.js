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

var VERB_ORDER = {
	"GET": 0,
	"POST": 1,
	"PUT": 2,
	"PATCH": 3,
	"DELETE": 4
};

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

		var resources = _.reduce( links, function ( memo, value, key ) {
			var keyParts = key.split( ":" );
			var resource = keyParts[ 0 ];
			var action = keyParts[ 1 ];
			memo[ resource ] = memo[ resource ] || [];
			memo[ resource ].push( _.extend( { name: action }, value ) );
			return memo;
		}, {} );



		_.each( resources, function( actions, resource ) {
			var resourceDefinition = hyped.resources[ resource ];
			var parent = resourceDefinition.parent;

			if ( !_.find( tags, { name: resource } ) && !parent ) {
				tags.push( {
					name: resource,
					description: resourceDefinition.description || ""
				} );
			}

			if ( resourceDefinition.schemas ) {
				resourceDefinition.schemas.forEach( function ( schema ) {
					schemas.push( patchAnyOfNullable( _.cloneDeep( schema ) ) );
				} );
			}

			actions.sort( function ( a, b ) {
				var aLength = a.href.split( "/" ).length;
				var bLength = b.href.split( "/" ).length;
				var aVerb = VERB_ORDER[ a.method ];
				var bVerb = VERB_ORDER[ b.method ];

				if ( aLength === bLength ) {
					return aVerb - bVerb;
				}

				return aLength - bLength;
			} );

			actions.forEach( function ( action ) {
				var actionDefinition = resourceDefinition.actions[ action.name ];
				var docs = actionDefinition.docs || {};

				paths[ action.href ] = paths[ action.href ] || {};
				paths[ action.href ][ action.method.toLowerCase() ] = {
					tags: [ parent ? parent : resource ],
					operationId: resource + ":" + action.name,
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
		} );

		var definitions = {};
		schemas.forEach( function ( schema ) {
			_.extend( definitions, schema.definitions );
			definitions[ schema.id ] = _.omit( schema, [ "definitions", "id" ] );
		} );

		response.tags = tags;
		response.paths = paths;
		response.definitions = definitions;

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
