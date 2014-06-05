var async = require('async');
var gracenode = require('../gracenode');
var logger = gracenode.log.create('server-response-hook');
var hookMapper = require('./hookMapper');
var serverError = require('./error');
var hooks = null;
var hookMap = {};

module.exports.setupResponseHooks = function (hooksIn) {
	hooks = hooksIn;
	hookMap = hookMapper.map(hooks);
};

module.exports.exec = function (responseObj, cb) {
	var resource = responseObj._resource;
	var requestObj = responseObj._requestObj;
	var hook = hookMapper.find(hookMap, resource.parsedUrl);
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
