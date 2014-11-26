var async = require('async');
var gracenode = require('../../gracenode');
var logger = gracenode.log.create('server-response-hook');
var hookMapper = require('./mapper');
var serverError = require('../lib/error');
var hookMapList = [];

module.exports.addHooks = function (hooks) {
	hookMapList.push(hookMapper.map(hooks));
	logger.verbose('response hook mapped and added to hook map list:', hookMapList);
};

// deprecated
module.exports.setupResponseHooks = module.exports.addHooks;

module.exports.exec = function (responseObj, cb) {
	var resource = responseObj._resource;
	var requestObj = responseObj._requestObj;
	var hook = hookMapper.find(hookMapList, resource.parsedUrl);
	if (hook) {
		return execHook(hook, resource, requestObj, responseObj, cb);
	}
	cb();
};

function execHook(hookList, resource, requestObj, responseObj, cb) {
	var count = 0;
	var url = resource.rawRequest.url;
	logger.verbose('response hook found for (url:' + url + ')');
	async.eachSeries(hookList, function (hook, next) {
		if (resource.hookErrored) {
			// response hook(s) errored already, we don't bother
			return next();
		}
		count += 1;
		hook(requestObj, function (error, status) {
			if (error) {
				logger.error('response hook #' + count + '(' + getHookName(hook) + ') executed with an error (url:' + url + '):', '(request-id:' + resource.rawRequest.uniqueId + ')', '(status: ' + status + ')');
				// to prevent infinite hook error on error response
				resource.hookErrored = true;
				// handle error as an error response
				var sError = serverError.create(resource);
				sError.setRequest(requestObj);
				sError.setResponse(responseObj);
				return sError.handle(error, status);
			}
			logger.verbose('response hook #' + count + '(' + getHookName(hook) + ') successfully executed (url:' + url + ')', '(request-id:' + resource.rawRequest.uniqueId + ')');
			next();
		});
	}, cb);
}

function getHookName(hook) {
	return hook.name || 'anonymous';
}

