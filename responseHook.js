var gracenode = require('../gracenode');
var logger = gracenode.log.create('server-response-hook');
var serverError = require('./error');
var hooks = null;

module.exports.setupResponseHooks = function (hooksIn) {
	hooks = hooksIn;
};

module.exports.exec = function (responseObj, cb) {
	if (hooks) {
		var resource = responseObj._resource;
		var requestObj = responseObj._requestObj;
		var hook;
		if (typeof hooks === 'function') {
			// request hook applies to all controllers and methods
			hook = hooks;
		}
		var hookedController = hooks[resource.parsedUrl.controller] || null;
		if (hookedController) {
			if (typeof hookedController === 'function') {
				// request hook applies to this controller and all of its methods
				hook = hookedController;
			}
		}
		var hookedMethod = hooks[resource.parsedUrl.method] || null;
		if (hookedMethod) {
			if (typeof hookedMethod === 'function') {
				// request hook applies to this controller and this method only
				hook = hookedMethod;
			}
		}

		// do we have a hook?
		if (hook) {
			return execHook(hook, resource, requestObj, responseObj, cb);
		}
	}
	// there is no response hook
	cb();
};

function execHook(hook, resource, requestObj, responseObj, cb) {
	var url = resource.rawRequest.url;
	logger.verbose('response hook found for (url:' + url + ')');
	hook(requestObj, function (error, status) {
		if (error) {
			logger.error('response hook executed with an error (url:' + url + '):', '(status: ' + status + ')');
			var sError = serverError.create(resource);
			sError.setRequest(requestObj);
			sError.setResponse(responseObj);
			return sError.handle(error, status);
		}
		logger.verbose('response hook successfully executed (url:' + url + ')');
		cb();
	});
}
