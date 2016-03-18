# Server Module

**WARNING**: `gracenode-server` supports up to `gracenode` version `2.5.3`

Server module for gracenode framework that allows you to structurely handle HTTP/HTTPS requests.

This is designed to function within gracenode framework.

## How to include it in my project

To add this package as your gracenode module, add the following to your package.json:

```
"dependencies": {
        "gracenode": "",
        "gracenode-server": ""
}
```

To use this module in your application, add the following to your gracenode bootstrap code:

```
var gracenode = require('gracenode');
// this tells gracenode to load the module
gracenode.use('gracenode-server');
```

To access the module:

```
// the prefix gracenode- will be removed automatically
gracenode.server
```

### Access
<pre>
gracenode.server
</pre>

Configurations
```javascript
"modules": {
        "gracenode-server": {
                "protocol": "http" or "https",
                "pemKey": "file path to pem key file" // https only
                "pemCert": "file path to pem cert file" // https only
                "secureOptions": "to prevent POODDLE exploit give SSL_OP_NO_SSLv3",  https only
		"port": port number,
                "host": host name or IP address,
                "urlPrefix": optional prefix in the URL to be ignored when routing requests
		"controllerPath": path to controller directory,
		"trailingSlash": true/false // if true is given, trailing slash in request URLs are enforced
                "ignored": ['name of ignored URI'...],
                "error": {
                        "404": {
                                "controller": controller name,
                                "method": public controller method
                        },
                        "500": ...
                },
                "reroute": [
                        {
                                "from": '/',
                                "to": '/another/place'
                        },
                        ...
                ]
        }
}
```

**URL Prefix**

If `urlPrefix` is set in the configurations, the router of `gracenode-server` module will ignored matched prefix in the URL for routing every request.

Example:

```
// configurations:
{
	"modules": {
		"gracenode-server": {
			"protocol": "http",
			"port": 8000,
			"urlPrefix": "/dummy/",
			"host": "localhost",
			"controllerPath": "controller/"
		}
	}
}
// incomming request
POST /dummy/mypage/getmyinfo/

// This request will be routed to:
/*
controller: mypage
method: getmyinfo
*/
// /dummy/ will be ignored and discarded
```

***

### SSL server
gracenode has bash scripts to help set up HTTPS server.
<pre>
gracenode/scripts/sslcertgen.sh //for production
gracenode/scripts/sslcertgen-dev.sh //for development
</pre>

***

### Events

#### requestStart

The event is emitted when a reuqest is received. Passes the request URL.
```
server.on('requestStart', function (requestUrl) {
        // do something
});
```

#### requestEnd

The event is emitted when a request has been handled (not responded). Passes the reuqest URL.
```
server.on('requestEnd', function (requestUrl) {
        // do something
});
```

#### requestFinish

The event is emitted when a request hash been handled and finished sending all response data. Passes the request URL.
```
server.on('requestFinish', function (requestUrl, executionTime) {
        // do somehting
});
```

***

### .start

Example of how to set up a server:

```javascript
// index.js file of an application
var gracenode = require('gracenode');
gracenode.use('server', 'server');
gracenode.setup(function (error) {
        if (error) {
                throw new Error('failed to set up gracenode');
        }
        // we start the server as soon as gracenode is ready
        gracenode.server.start();
});
```

***

### .addRequestHooks

<pre>
void addRequestHooks(Object hooks)
</pre>

Assign a function to be invoked on every request (each hook callback function is assigned to specific controller method).

Should be used for session validatation etc.

Example:

```javascript
// add a hook to all requests
function hookForAll(request, next) {
        next();
}
gracenode.server.addRequestHooks(hookForAll);
// checkSession will be executed on every request for myController/myPage after the hook for all requests
function checkSession(request, callback) {
        var sessionId = request.cookies().get('sessionId');
        gracenode.session.getSession(sessionId, function (error, session) {
                if (error) {
                        return cb(error);
                }
                if (!session) {
                        // no session
                        return cb(new Error('auth error', 403));
                }
                // session found
                cb();
        });
}
// set up the hook
gracenode.server.addRequestHooks({
        myController: {
                myPage: checkSession
        }
});
```

```javascript
// this will apply checkSession function as a request hook to ALL controller and methods
var hooks = checkSession;
// this will apply checkSession function as a request hook to ALL methods of myController
var hooks = {
        myController: checkSession
};
// set up request hooks
gracenode.server.addRequestHooks(hooks);
```

```javascript
// this will apply checkSession function as a request hook to myPage of myController only
var hooks = {
        myController: {
                myPage: checkSession
        }
};
// set up request hooks
gracenode.server.addRequestHooks(hooks);
```

### How to assign multiple hooks

.addRequestHooks can let you assign more then one hook function to specific controller/method or even to all reuqests:

```
gracenode.addRequestHooks({
        myController: [
                hook1,
                hook2,
                hook3
        ]
});
```

The assigned hooks will be executed in the order of the array given.

***

### .addResponseHooks

```
void addResponseHooks(Object hooks);
```

Assign a function to be invoked on every response (each hook callback function is assigned to specific controller method).

This is useful when you need to execute certian operation on every request response

The basic behavior of response hooks are very similar to reqest hooks.

Example:

```
function hookForAll(request, cb) {
        cb();
}

function writeTrackingData(requestObject, cb) {
        // write tracking data based on request data
        if (error) {
                return cb(new Error('failed'));
        }
        // success
        cb();
}

gracenode.server.addResponseHooks(hookForAll);

gracenode.server.addResponseHooks({
        myController: writeTrackingData
});
```

Above assignment of hooks will execute `hookForAll` on EVERY response and `writeTrackingData` after on `/myController`

### How to assign multiple hooks

.addResponseHooks can let you assign more then one hook function to specific controller/method or even to all responses:

```
gracenode.addResponseHooks({
        myController: [
                hook1,
                hook2,
                hook3
        ]
});
```

The assigned hooks will be executed in the order of the array given.

### .getControllerMap

Returns mapped controllers and their methods.

### .getEndPointList

Returns an array of all URL endpoints.

***

## Controller
Controller handles all requests to server module.

Example:

```javascript
// controller/example/foo.js /example/foo/
var gracenode = require('gracenode');
// the first argument is **ALWAYS** requestObject
// this will handle requests with "GET" method ONLY
module.exports.GET = function (requestObject, serverResponse) {
        // serverResponse is created by server module per request
        serverResponse.json({ foo: 'foo' });
};
// /example/foo/ will display "foo" on your browser
```

## Translating request URL to controller/method

gracenode's server module translates request URL to route all requests to correct controllers and methods and pass the rest of request parameters to the controller method as reuqest.parameters [array].

```javascript
// Suppose we have a request like this: GET mydomain.com/myController/myMethod/a/b/c/d
// controller translates this as:
// myController/myMethod.js
module.exports.GET = function (request, response) {
        var params = request.parameters;
        /*
        [
                "a",
                "b",
                "c",
                "d"
        ]
        */
};
```

## Pre-defined URL parameteres

Each controller method can optionally have pre-defined parameter names.

To added pre-defined paramter names, add the following in your controller method:

Example:

```
// request URL yourapp.com/example/test/myParam1/myParam2/
module.exports.params = [
    'foo',
    'boo'
];
module.exports.GET = function (request, response) {
    var foo = request.getParam('foo');
    // foo is 'myParam1'
    var boo = request.getParam('boo');
    // boo is 'myParam2'
};
```

## Subdirectories

`gracenode-server` module supports subdirectories in your controller and methods.

For example, a request URI such as `/yourController/yourMethod/sub/foo` would be translated as:

```
{
	controller: 'yourController',
	method: 'yourMethod',
	params: [
		'sub',
		'foo'
	]
}
```

However, by creating a request handling method in `/yourController/yourMethod/sub/foo.js`, server will be executing `/yourController/yourMethod/sub/foo.js` instead of `/yourController/yourMethod.js`.

**NOTE:**Both request hooks and response hooks can also be applied to specific subdirectory methods.

## Request Method Restrictions

Each controller method accepts and executes requests with *declared* request method ONLY.

Example:

```
// POST /exmaple/boo -> exmaple/boo.js
module.exports.POST = function (req, res) {
        // do something
};
```

Above example is the controller method for POST requests (POST /example/boo).

If any other request method than POST is sent, the server will response with an error (status 400).

#### Request URL

Request URL can be accessed as shown below.

```javascript
module.exports.GET = function (requestObject, response) {
        var url = requestObject.url;
};
```

#### How to read GET, POST, PUT, and DELETE

Request data can be accessed according to the request methods as shown below.

```javascript
// read GET data
module.exports.GET = function (requestObject, response) {
        // server module supports GET, POST, PUT, or DELETE
        var foo = requestObject.data('foo');
        var allData = requestObject.dataAll();
        response.json(null);
};
// read POST data
module.exports.POST = function (requestObject, response) {
        // server module supports GET, POST, PUT, or DELETE
        var foo = requestObject.data('foo');
        var allData = requestObject.dataAll();
        response.json(null);
};
// read PUT data
module.exports.PUT = function (requestObject, response) {
        // server module supports GET, POST, PUT, or DELETE
        var foo = requestObject.data('foo');
        var allData = requestObject.dataAll();
        response.json(null);
};
// read DELETE data
module.exports.DELETE = function (requestObject, response) {
        // server module supports GET, POST, PUT, or DELETE
        var foo = requestObject.data('foo');
        var allData = requestObject.dataAll();
        response.json(null);
};
```

Example:

```
// sent data from client: { "value": "12345" } with request header Content-Type: application/json
module.exports.GET = function (request, response) {
        // this will return "12345"
        var literalStr = request.data('value', true);
        // this will return 12345
        var int = request.data('value');
};
```

### Auto Request Body Data Validation

`gracenode-server` can optionally validate incoming request data of every request.

To set up auto request body data validation, you must add a property called `expected` in your controller method file.

Exmaple (request URL: /hello/world/):

```
// each key of expected holds a validation function that returns an error for invalid value
exports.expected = {
	message: function validation(value) {
		if (!value) {
			return new Error('message must be given');
		}
		if (typeof value !== 'string') {
			return new Error('message must be a string');
		}
	}
};
exports.GET = function (request, response) {
	// message has already been validate and it is safe for us to use its value!
	var message = request.data('message');
};
```

The above example defines an expected request body data called `message`.

This API now requires every request to this end point to have `message` and the value of the message **MUST** validate with the associated validation function.

If validation fails, the request will respond with 400 status code. 

### Dealing With Uploaded Files

`gracenode-server` has 2 functions to deal with uploaded files.

The functions are methods of a request object.

#### request.moveUploadedFile(path [string], newPath [string], cb [function])

Moves an uploaded file from temporary path to a new location.

Typically, the uploaded files are located in `/tmp/` directory

Example:

```javascript
exports.PUT = function (request, response) {
	var files = request.data('files');
	request.moveUploadedFile(files[0].path, newPath, function (error) {
		if (error) {
			return response.error(error, 500);
		}
		response.json({ message: 'uploaded' });
	});
};
```

#### request.getUploadedFileData(path [string], cb [function])

Reads the data from an uploaded file and deletes the file.

Example:

```javascript
exports.PUT = function (request, response) {
	var files = request.data('files');
	request.getUploadedFileData(files[0].path, function (error, data) {
		if (error) {
			return response.error(error, 500);
		}
		// do something with the read data...
		response.json({ message: 'uploaded and read' });
	});
	
};
```

### Accessing Controller Name and Controller Method Name:

```javascript
// controller file
// URI: /test/one/
module.exports.GET = function (requestObject, response) {
        console.log(requestObject.controller);
        // "test"
        console.log(requestObj.method);
        // "one"
};
```

**NOTE:** Subdirectory methods would return the path to the subdirectory method as the method name.

Example:

```
// URI: /test/sub/foo/
module.exports.GET = function (requestObject, response) {
	var methodName = requestObject.method;
	// sub/foo
};
```

### Request Headers

Request headers are accessed as:

```javascript
// controller file
module.exports.GET = function (requestObject, response) {
        // server module automatically gives every contrller the following function:
        // requestObject.headers an instance of Headers class
        var os = requestObject.headers.getOs();
};
```


## Headers class

Headers object holds all request headers and related methods.

Access:

 ```javascript
module.exports.GET = function (requestObject, response) {
        var requestHeaders = requestObject.headers;
};
```

#### headers.get
<pre>
String get(String headerName)
</pre>

#### headers.getOs
<pre>
String getOs()
</pre>

#### headers.getClient
<pre>
String getClient()
</pre>

#### headers.getDefaultLang
<pre>
String getDefaultLang
</pre>

#### Cookies

This object holds and contains all cookie related data and methods.

```javascript
// controller
module.exports.GET = function (requestObject, response) {
        var cookies = requestObject.cookies();
        // get
        var foo = cookies.get('foo');
        // set
        cookies.set('boo', 'boo');
};
```

***

## Response class

Response class manages all server responses to the client requests.

#### response.getRequest

Returns an instance of a request object.

#### response.header

Response headers can be set/removed as shown below.

Example for adding a response header

```javascript
// controller
module.exports.GET = function (requestObject, response) {
        // name, value
        response.header('foo', 'foo');
};
```

Example for removing a response header

```javascript
module.exports.GET = function (requestObject, response) {
	// remove header
	response.header('Pragma', null);
};
```

#### response.json

Resonds to the client as JSON.

Status code is optional and default is 200.
<pre>
Void response.json(Mixed content, Integer status)
</pre>

#### response.html

Resonds to the client as HTML.

Status code is optional and default is 200.
<pre>
Void response.html(String content, Integer status)
</pre>

#### response.error

Responds to the client as an error. content can be JSON, String, Number.

Status code is optional and default is 404.

<pre>
Void response.error(Mixed content, Integer status)
</pre>

#### response.stream

Streams a file to the client.

If request header contains `range` header, it will stream with `status 206`.

<pre>
Void response.stream(String filePath, String fileType)
</pre>

**NOTE**: File types are: mp4, ogg etc.

#### response.download

Let the client download data as a file.

<pre>
Void response.download(String data, String fileName, int status);
</pre>

#### response.data

Response to the client with raw data. Used to let the client download data as a file.

Typically, you should be using response.download() instead for file downloads.

<pre>
Void response.data(String data)
</pre>

Example:

```
// API to download a CSV file format
module.exports.GET = function (requestObj, response) {
        var filename = 'test.csv';
        var csvData = 'columnA,columnB\nAAA,BBB\nCCC,DDD\nEEE,FFF';
        // set response headers
        response.header('Content-Disposition', 'attachment; filename=' + filename);
        response.header('Content-Type', 'csv');
        response.data(csvData);
};
```

#### response.redirect

Redirects the request to another URL with HTTP status 307.

```javascript
// controller
// request URI /foo/index/
module.exports.GET = function (requestObject, response) {
        response.redirect('/anotherPage/');
};
```

To redirect with other status code than 307, for example 301:

```javascript
module.eports.GET = function (requestObject, response) {
	response.redirect('/redirect/to/this/page', 301);
};
```

#### response.file (Not recommanded)
Resonds to the client as a static file.
Status code is optional and default is 200.
<pre>
Void response.file(Binary content, Integer status)
</pre>

***

## Configuring Error Handlers

Server module allows the developer to assigned specific error handling constroller end method based on HTTP response status

Example:

```
// configurations:
{
        "server": {
                "404": {
                        "controller": "error",
                        "method": "notFound"
                }
        }
}
```

The above example assigns the controller "error" and method "notFound" (controller/error/notFound.js) to status code 404.

When the server responds with status 404, the server will then execute error/notFound.js.

## Building a Web Server

gracenode has a built-in module called "server". This module allows you to create and run either HTTP or HTTPS server.

For more details about server module please read <a target="_blank" href="https://github.com/voltrue2/gracenode/tree/master/modules/server">here</a>.

#### How to tell gracenode to use server module

```javascript
// this is your application index.js
var gn = require('gracenode');

// tell gracenode where to look for configuration file(s)
// gracenode always looks from the root path of your application
gn.setConfigPath('configurations/');

// tell gracenode which configuration file(s) to load
gn.setConfigFiles(['config.json']);

// tell gracenode to load server module
gn.use('server');

gn.setup(function (error) {
    if (error) {
        return console.error('Fatal error on setting up gracenode');
    }

    // gracenode is now ready
    // start the server
    gn.server.start();

});
```

#### How to configure server module

Please refer to <a target="_blank" href="https://github.com/voltrue2/gracenode/tree/master/modules/server">server module README</a> for more details.

```
// this the minimum requirements for server module to run
{
    "modules": {
        "server": {
            "protocol": "http",
            "host": "localhost",
            "port": 8000,
            "controllerPath": "controller/"
        }
    }
}
```

#### How to create your "Hello World" page

Assuming that you are using configurations like the above, we can create our "Hello World" controller in:

`yourapp/controller/helloworld/`

Let's assume that our URL for "Hellow World" page would be "http://yourapp.com/hellowworld/sayhello".

Server module translates the above URL to be like this:

"helloworld" after the domain is interpreted to be the controller directory as `yourapp/controller/helloworld/`.

"sayhello" is your actual controller and it would be assumed to be `yourapp/controller/helloworld/sayhello.js`.

#### Add the controller logic to sayhello.js

We will assume that this URL will be a GET request.

```javascript
// this is what's inside sayhello.js
// server controller will always recieve a request object and response object on each request
// notice that we specifically say "GET". this is telling server module to handle GET request only.
module.exports.GET = function (request, response) {
    // since there isn't much to do, we will send the response back to the client right away
    response.html('<h1>Hello World</h2>');
};

```

### More Advanced Features

There are more complex things you can do with server module. For example rerouting is one of them.

#### How to reroute a URL to a specific controller and its method

Assume we want to have a URL like this "http://yourapp.com/helloworld".

But we want to execute `yourapp/controller/helloworld/sayhello.js` for this URL.

This kind of rerouting can be achieved by setting "reroute" in the configurations.

```
{
    "modules": {
        "server": {
            "protocol": "http",
            "host": "localhost",
            "port": 8000,
            "controllerPath": "controller/",
            "reroute": [
                { "from": "/", "to": "helloworld/sayhello" }
            ]
        }
    }
}
```

Notice we have a new configuration object called "reroute" in the above configurations.

This configuration allows server module to execute `helloworld/sayhello.js` when the server receives a reuqest to "http://yourapp.com/helloworld".

#### Assign uniformted error controllers on specific error status

Server module also allows you to pre-define controllers to be executed on specific errors.

For example if your want to display a certain page for "404 Not Found" error, we can assign a specific controller and method for it.

```
{
    "modules": {
        "server": {
            "protocol": "http",
            "host": "localhost",
            "port": 8000,
            "controllerPath": "controller/",
            "reroute": [
                { "from": "/", "to": "helloworld/sayhello" }
            ],
            "error": {
                "404": {
                    "controller": "error",
                    "method": "notFound"
                }
            }
        }
    }
}
```

Notice we have a configuration object called "error" in the above configurations.

This tells server module to execute `yourapp/controller/error/notFound.js` on HTTP status 404.

#### Request Hooks

Server module can let you assign certain function(s) to be executed on requests.

This is usefuly for session validation on requests etc.

Example:

```
gracenode.setup(function () {

        // assign session validation function to all requests under "example" controller
        gracenode.server.addRequestHooks({
                example: function (request, callback) {
                        if (isSessionValid()) {
                                // session is valid. continue to execute the request
                                return cb();
                        }
                        // session is not valid. respond with error
                        cb({ code: 'invalidSession' }, 403);
                }
        });
});
```

