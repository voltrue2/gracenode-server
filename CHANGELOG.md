# Change Log

This is a list of manually mantained changes nad updates for each version.

## Version 0.5.0

## Added

None

## Changed

#### gzip response is only when requested by request header

## Deprecated

None

## Removed

None

***

## Version 0.4.3

## Added 

#### response.stream(filePath, fileType) added

## Changed

None

## Deprecated

None

## Removed

None

## Version 0.4.2

## Added

None

## Changed

#### Corrected response status code for invalid request method from 400 to 405

## Deprecated

None

## Removed

***

## Version 0.4.1

## Added

#### Added support for HTTP method PATCH

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.4.0

## Added

None

## Changed

#### Auto decode encoded URI for URL parameters

#### Updated a dependency request-router version to 0.2.2

#### Warning log for invalid request method has more detailed information

## Deprecated

None

## Removed

None

***

## Version 0.3.19

## Added

None

## Changed

#### Both HTTP and HTTPS servers added proper listener on server started

#### README format is now compatible with new npm site

## Deprecated

None

## Removed

None

***

## Version 0.3.18

## Added

None

## Changed

#### Bug fix in response.download()

The response headers were incorrectly set.

## Deprecated

None

## Removed

None

***

## Version 0.3.17

## Added

None

## Changed

#### Improved error handling of server failure when starting

## Deprecated

None

## Removed

None

***

## Version 0.3.16

## Added

None

## Changed

#### requestFinish event now emmits response status code as well

## Deprecated

None

## Removed

None

***

## Version 0.3.15

## Added

`urlPrefix` added to configuration.

If `urlPrefix` is given, the matched string in every incomming request URL will be ignored and discarded when routing to controller and method.

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.3.14

## Added

#### Added a new function .getEndPointList() to retrieve all URL endpoints as an array

## Changed

#### Pre-defined error controllers/methods do not inherit subdirectory path

## Deprecated

None

## Removed

None

***

## Version 0.3.13

## Added

None

## Changed

#### Forcing a trailing slash with GET queries will not be appending a slash at the end, instead it will now be appending it at the end of URI

Example:

`GET /example?test=1` will be `/example/?test=1` instead of `/example?test=1/`.

#### Query values of GET requests will now be removing slashes automatically

Example:

```
GET /example/?id=1234/
```

The above request will yeild `id = 1234` instead of `id = "1234/"`.

## Deprecated

None

## Removed

None

***

## Version 0.3.12

## Added

None

## Changed

#### Dependecny request-router module version updated to 0.2.1

## Deprecated

None

## Removed

None

***

## Version 0.3.11

## Added

None

## Changed

#### Bug fix: request.data() does not throw an exception on errored requests

#### Resource Class Refactored

## Deprecated

None

## Removed

None

***

## Version 0.3.10

## Added

None

## Changed

#### response.json() now sends content-type application/json header again

This is a bug fix that was introduced in `2f9847af4cad3b5515f2525feff03f9b0792fc36`. 

## Deprecated

None

## Removed

None

***

## Version 0.3.9

## Added

None

## Changed

#### response.file() no longer sends Content-Encoding header

This is a bug fix.

The bug was introduced in version `0.3.8`, by setting the default response headers for all respojnses.

## Deprecated

None

## Removed

None

***

## Version 0.3.8

## Added

None

## Changed

#### Response object's .header() can now remove headers by ging either null of undefined value

Example:

```
exports.GET = function (request, response) {
	// remove Pragma header
	response.header('Pragma', null);
	// do something
};
```

## Deprecated

None

## Removed

None

***

## Version 0.3.7

## Added

None

## Changed

#### Response object's .header() can now change default response headers such as Cache-Control etc

#### Every incoming request now logs request headers as info

## Deprecated

None

## Removed

None

***

## Version 0.3.6

## Added

#### Optional property expected added to every controller method

By providing `exports.expected` object in your controller method, `gracenode-server` can automatically validate incoming request data.

## Changed

None

## Deprecated

None

## Removed

***

## Version 0.3.5

## Added

#### Request/Response hooks now outputs (to logger) hook function names if given

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.3.4

## Added

#### - Request object added 2 new methods to deal with uploaded files

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.3.3

## Added

#### Support for enforcing trailing slash in request URLs added

In the configurations, you can now give `trailingSlash: true` to enforce trailing slash in all request URLs.

## Changed

#### Error log for unexpectly terminated connections now contain request headers

## Deprecated

None

## Removed

None

***

## Version 0.3.2

## Added

None

## Changed

#### HTTP status for redirection can be now changed to other status code than 307 by giving a second argument.

```
response.redirect('/redirect/to/this/page', 301);
```

## Deprecated

None

## Removed

None

***

## Version 0.3.1

## Added

None

## Changed

#### HTTP status for redirection changed from 301 to 307.

## Deprecated

None

## Removed

None

***

## Version 0.3.0

## Added

#### Support for subdirectories in controller/method

`gracenode-server` module now supports a controller method such as `mycontroller/mymethod/sub/executeme.js`.

Subdirectory methods are still considered to be part of `controller` and its `method`.

The hooks assigned to the `controller` and its `method` will be applied to subdirectory methods.

## Changed

#### Request object .method property now supports subdirectory methods

#### Request and response hooks now support subdirectory methods.

Example:

```
// Request URI: /test/foo/sub/callme
exports.GET = function (req, res) {
	var methodName = req.method;
	// foo/sub/callme
};
```

## Deprecated

None

## Removed

None

***

## Version 0.2.1

## Added

#### Added a new configuration secureOptions for HTTPS server

Added a new optional configuration to prevent POODLE exploit by giving "SSL_OP_SSLv3" to `secureOptions` in

configurations. This will disable SSLv 3.

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.2.0

## Added

#### Request added getParam() to retrieve pre-defined parameters from the request URL

Controller methods can optionally have pre-defined parameter names by adding the following in the code:

```
// request URL: yourapp.com/example/test/foo/boo/
exports.params = [
	'one',
	'two'
];
exports.GET = function (request, response) {
	var one = request.getParam('one');
	// the of one is 'foo'
	var two = request.getParam('two');
	// the value of two is 'boo'
};
```

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.1.33

## Added

None

## Changed

#### Redirection no longer contains the host name

## Deprecated

None

## Removed

None

***

## Version 0.1.32

## Added

None

## Changed

#### Does not log request data as info anymore

For possible security improvement.

## Deprecated

None

## Removed

None

***

## Version 0.1.31

## Added

#### Request object added new properties controller and method

Requesst object now has 2 new properties to retrieve the controller name and controller method name.

Exmaple:

```
// URI: /test/one
module.exports.POST = function (request, response) {
	console.log(request.controller);
	// "test"
	console.log(request.method);
	// "one"
};
```

## Changed

#### Minor bug fix in request header verbose logging

## Deprecated

None

## Removed

None

***

## Version 0.1.28

## Added

#### Response object added a new method getRequest()

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.1.27

## Added

None

## Changed

#### Redirection now has host in the URL

Bug fix for `response.redirect('/redirect/here')`. The bug was creating an infinite redirection loop
if the target URL had more than `/controller/method/`.

## Deprecated

None

## Removed

None

***

## Version 0.1.26

## Added

#### .addRequestHooks and .addResponseHooks added

`addRequestHooks` and `addResponseHooks` added to add hooks on request and response.

The basic usage of these new functions is very similar to deprecated `setupRequestHooks` and `setupResponseHooks`.

The difference is that you may call `addRequestHooks` and `addResponseHooks` more then once.

Example:

```
function hookForAllRequest(request, next) {
	// do something
	next();
}

function hookForSomeAPI(request, next) {
	next();
}

gracenode.server.addRequestHooks(hookForAllRequests);
gracenode.server.addRequestHooks({
	helloworld: hookForSomeAPI
});
```

The above example assigns a hook to all requests and a hook to `/helloworld`.

## Changed

#### Error responses now have request object

#### Duplicate response check added to error response

An error response now checks for duplicate response and prevent the server from responding more than once. 

#### Response hooks 

Response hooks now executes on every response that has hooks assigned including error responses.

#### Minor code improvements

## Deprecated

#### .setupRequestHooks and .setupResponseHooks deprecated in favor of .addRequestHooks and .addResponseHooks

## Removed

None

***

## Version 0.1.25

## Added

#### Request object added requestId property

`request.requestId` is a unique ID per request. Useful for debug logging etc.

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.1.24

## Added

## Changed

#### HEAD method is now correctly handled

HEAD request method will not receive response data.

HEAD request methods are accepted by GET method controllers.

## Deprecated

None

## Removed

None

***

This is a list of manually mantained changes nad updates for each version.

## Version 0.1.23

## Added

## Changed

#### Minor improvements in lib/request.js for parsing request data

## Deprecated

None

## Removed

None

***

## Version 0.1.22

## Added

#### Added async as dependency

## Changed

None

## Deprecated

None

## Removed

None

***

## Version 0.1.21

## Added

None

## Changed

#### Catches missing controllers when mapping them

## Deprecated

None

## Removed

None

***

## Version 0.1.20

## Added

None

## Changed

#### none-json request body's data type is now kept correct

## Deprecated

None

## Removed

None

***

## Version 0.1.19

## Added

None

## Changed

#### request queires other then GET method, does not auto-type-cast

Example: 

```
// request body of POST
{ "id": "12345" }
// will be 
var id = request.data('id');
// "12345"
```

```
// request query of GET
?id=12345
// will be
var id = request.data('id');
// 12345
```

#### Unit test updated

## Deprecated

None

## Removed

None

***

## Version 0.1.18

## Added

None

## Changed

#### Directory structure changed

#### Each request carries a unique request ID

#### Unit test updated

## Deprecated

None

## Removed

None

***
