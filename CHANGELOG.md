# Change Log

This is a list of manually mantained changes nad updates for each version.

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