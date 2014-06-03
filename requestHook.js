var async = require('async');
var gracenode = require('../gracenode');
var logger = gracenode.log.create('server-request-hook');
var serverError = require('./error');
var hooks = null;

module.exports.setupRequestHooks = function (hooksIn) {
	hooks = hooksIn;
};

module.exports.exec = function (resource, requestObj, responseObj, methodFunc) {
	if (hooks) {
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
			execHook(hook, resource, requestObj, responseObj, methodFunc);
			return true;
		}
	}
	// there is no hook for this request
	return false;
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

function execHook(hookList, resource, requestObj, responseObj, methodFunc) {
	var count = 0;
	var url = resource.rawRequest.url;
	logger.verbose('request hook found for (url:' + url + ')');
	async.eachSeries(hookList, function (hook, next) {
		hook(requestObj, function (error, status) {
			count += 1;
			if (error) {
				logger.error('request hook #' + count + ' executed with an error (url:' + url + '):', '(status: ' + status + ')');
				var sError = serverError.create(resource);
				sError.setRequest(requestObj);
				sError.setResponse(responseObj);
				return sError.handle(error, status);
			}
			logger.verbose('request hook #' + count + ' successfully executed (url:' + url + ')');
			next();
		});
	},
	function () {
		methodFunc(requestObj, responseObj);
	});
}
