var uuid = require('node-uuid');
var gracenode = require('gracenode');
var log = gracenode.log.create('server');
var async = require('async');
var http = require('./http');
var https = require('./https');
var router = require('./lib/router');
var controller = require('./lib/controller');
var resource = require('./lib/resource');
var serverError = require('./lib/error');
var reqHook = require('./hooks/request');
var resHook = require('./hooks/response');

var EventEmitter = require('events').EventEmitter;

var config = null;
var serverEngine = null;
var server = null;

module.exports = new EventEmitter();

module.exports.readConfig = function (configIn) {
	
	config = configIn;
	
	if (config.protocol === 'https') {
		serverEngine = https;
	} else {
		serverEngine = http;
	}
	
	serverEngine.readConfig(config);
	router.readConfig(config);
	controller.readConfig(config);
	serverError.readConfig(config);
};

module.exports.setup = function (cb) {
	var list = [];
	if (config.protocol === 'https') {
		list.push(serverEngine.setup);
	}
	
	log.info('server protocol: ' + config.protocol);

	list.push(router.setup);

	async.series(list, cb);
};

module.exports.getControllerMap = function () {
	return router.getControllerMap();
};

module.exports.addRequestHooks = function (hooks) {
	log.verbose('add request hooks:', hooks);
	reqHook.addHooks(hooks);
};

module.exports.addResponseHooks = function (hooks) {
	log.verbose('add reseponse hooks:', hooks);
	resHook.addHooks(hooks);
};

/*
Deprecated
hooks: {
	"<controller name>": {
		"<method name>": <hook function>
	}
}
*/
// if set, controller.exec will not be invoked until requestHook is successfully executed
// use case example: session check etc
module.exports.setupRequestHooks = function (hooks) {
	log.verbose('setting up request hooks:', hooks);
	reqHook.setupRequestHooks(hooks);
};

module.exports.setupResponseHooks = function (hooks) {
	log.verbose('setting up response hooks:', hooks);
	resHook.setupResponseHooks(hooks);
};

module.exports.start = function () {

	log.verbose('starting server...');

	try {
		server = serverEngine.start(requestHandler);	
	} catch (exception) {
		log.fatal(exception);
	}
};

function requestHandler(request, response) {

	if (config.trailingSlash) {
		var trailing = request.url.substring(request.url.length - 1);
		if (trailing !== '/') {
			log.verbose('enforcing trailing slash on', request.url);
			response.writeHeader(301, { location: request.url + '/' });
			return response.end();
		}
	}
	
	// assign a unique id to each request
	request.uniqueId = uuid.v4(); 

	// listen for unexpected termination of connection
	response.on('close', function () {
		log.error('connection closed unexpectedly: (url:' + request.url + ') (request-id:' + request.uniqueId + ')', request.headers);
	});

	module.exports.emit('requestStart', request.url);

	// response module emits server.emit('requestEnd', request.url)

	// if parsedUrl returns as null, the request has been ignored
	var parsedUrl = router.handle(request.url, response);
	if (parsedUrl) {
		// create resource
		var resc = resource.create(module.exports, request, response, parsedUrl, Date.now());
		// execute controller
		controller.exec(resc);
	}
}
