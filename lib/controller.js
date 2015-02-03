var gracenode = require('../../gracenode');
var log = gracenode.log.create('server-controller');
var Request = require('./request');
var response = require('./response');
var serverError = require('./error');
var hook = require('../hooks/request');

var config = null;

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.controllerPath) {
		throw new Error('invalid configurations:\n', JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.exec = function (resource) {
	var request = new Request(resource);

	request.setup(function (error) {
		if (error) {
			return errorHandler(resource);
		}
		// check for not found error
		if (resource.parsedUrl.notFound) {
			return errorHandler(resource, request);
		}
		module.exports.handle(resource, request);
	});
}; 

module.exports.handle = function (resource, requestObj) {
	// path: controllerDirectory/methodFile
	var path = gracenode.getRootPath() + config.controllerPath + resource.parsedUrl.controller;
	path += '/' + resource.parsedUrl.method + resource.parsedUrl.subdir;

	var method = require(path);

	// controller method
	var methodExec = method[requestObj.getMethod()] || null;

	// if the controller expects a GET and the request is HEAD, we let the HEAD request through
	if (!methodExec && requestObj.getMethod() === 'HEAD' && method.GET) {
		log.info(requestObj.url + ' expects GET, but HEAD is also allowed');
		methodExec = method.GET;
	}	

	// validate request method
	if (!methodExec) {
		var msg = requestObj.url + ' does not accept "' + requestObj.getMethod() + '"';
		return errorHandler(resource, requestObj, msg, 400);
	}

	// check for mapped parameters (optional)
	var paramList = method.params || [];
	requestObj.setParamMap(paramList);

	// check for expected (optional)
	var expected = method.expected || null;
	if (expected) {
		var error = handleExpected(requestObj, expected);
		if (error) {
			return errorHandler(resource, requestObj, error.message, 400);
		}
	}

	// create response object
	var responseObj = response.create(resource, requestObj);

	// if this is pre-defined error controller, use the assigned status
	if (resource.error) {
		responseObj._setDefaultStatus(resource.error.status);
	}

	// override _errorHandler for responseObj.error()
	responseObj._errorHandler = function (error, status) {
		errorHandler(resource, requestObj, error, status);
	};

	// check for request hook
	var requestHookExecuted = hook.exec(resource, requestObj, responseObj, methodExec);
	if (requestHookExecuted) {
		return;
	}

	log.verbose(
		resource.parsedUrl.controller + '/' + resource.parsedUrl.method +
		' [' + requestObj.getMethod() + '] executed'
	);

	// invoke the controller method
	methodExec(requestObj, responseObj);
};

function handleExpected(req, expected) {
	// execute given validation function on each expected data
	for (var name in expected) {
		var data = req.data(name);
		var error = expected[name](data);
		if (error instanceof Error) {
			log.error('expected request data [' + name + '] validation failed (url:' + req.url + ')');
			return error;
		}
		log.verbose('expected request data [' + name + '] validated:', data, '(url:' + req.url + ')');
	}
	return null;
}

function errorHandler(resource, requestObj, msg, status) {
	var sError = serverError.create(resource);
	if (requestObj) {
		sError.setRequest(requestObj);
	}
	sError.handle(msg, status);
}
