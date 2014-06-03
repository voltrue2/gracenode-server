var async = require('async');
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
		var hookAll = hasHooks(hooks);
		if (hookAll) {
			// request hook applies to all controllers and methods
			hook = hookAll;
		}
		var hookedController = hasHooks(hooks[resource.parsedUrl.controller]);
		if (hookedController) {
			// request hook applies to this controller and all of its methods
			hook = hookedController;
		}
		var hookedMethod = hasHooks(hooks[resource.parsedUrl.method]);
		if (hookedMethod) {
			// request hook applies to this controller and this method only
			hook = hookedMethod;
		}

		// do we have a hook?
		if (hook) {
			return execHook(hook, resource, requestObj, responseObj, cb);
		}
	}
	// there is no response hook
	cb();
};

function hasHooks(hooks) {
	if (Array.isArray(hooks) && typeof hooks[0] === 'function') {
		// multiple hooks found
		return hooks;
	} else if (typeof hooks === 'function') {
		// one hook found
		return [hooks];
	}
	// no hook(s) found
	return null;
}

function execHook(hookList, resource, requestObj, responseObj, cb) {
	var count = 0;
	var url = resource.rawRequest.url;
	logger.verbose('response hook found for (url:' + url + ')');
	async.eachSeries(hookList, function (hook, next) {
		count += 1;
		hook(requestObj, function (error, status) {
			if (error) {
				logger.error('response hook #' + count + ' executed with an error (url:' + url + '):', '(status: ' + status + ')');
				var sError = serverError.create(resource);
				sError.setRequest(requestObj);
				sError.setResponse(responseObj);
				return sError.handle(error, status);
			}
			logger.verbose('response hook #' + count + ' successfully executed (url:' + url + ')');
			next();
		});
	}, cb);
}
