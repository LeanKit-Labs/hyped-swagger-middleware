# hyped-swagger-middleware

Autohost + Hyped middleware that can be wired up to an endpoint that will return a Swagger API doc spec file.

_Warning: This example might be a little rough if you are starting from scratch. This is primarily to show how to integrate with an existing hyped + autohost solution._

## Installation

```bash
npm install hyped-swagger-middleware --save
```

## Usage

```js
// index.js
var apiMetadata = {
    apiRoot: "/",
    version: "1.0.0",
    title: "Hyped API",
    description: "Our api",
    tos: "http://example.com/terms_of_service",
    contact: {
        name: "John Doe",
        email: "john.doe@example.com",
        url: "http://example.com"
    },
    license: {
        name: "Commercial",
        url: "http://example.com/license"
    }
};

var autohost = require( "autohost" );
var hyped = require( "hyped" )( true, true );
var swaggerMiddleware = require( "hyped-swagger-middleware" );
var host = hyped.createHost( autohost, {
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
```


## Example

Look at the `example` directory to see an example implementation. To run the example:

```bash
npm install
npm run example
```

Then in a new window:
```bash
curl http://localhost:8800/api/swagger/1/swagger.json
```

