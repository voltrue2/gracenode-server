var async = require('async');
var gracenode = require('../../gracenode');
var logger = gracenode.log.create('server-request-hook');
var serverError = require('../lib/error');
var hookMapper = require('./mapper');
var hooks = null;
var hookMap = {};

module.exports.setupRequestHooks = function (hooksIn) {
	hooks = hooksIn;
	hookMap = hookMapper.map(hooks);
	logger.verbose('request hook mapped', hookMap);
};

module.exports.exec = function (resource, requestObj, responseObj, methodFunc) {
	var hook = hookMapper.find(hookMap, resource.parsedUrl);
	if (hook) {
		execHook(hook, resource, requestObj, responseObj, methodFunc);
		return true;
	}
	return false;
};

function execHook(hookList, resource, requestObj, responseObj, methodFunc) {
	var count = 0;
	var url = resource.rawRequest.url;
	logger.verbose('request hook found for (url:' + url + ')');
	async.eachSeries(hookList, function (hook, next) {
		hook(requestObj, function (error, status) {
			count += 1;
			if (error) {
				logger.error('request hook #' + count + ' executed with an error (url:' + url + '):', '(request-id:' + resource.rawRequest.uniqueId + ')', '(status: ' + status + ')');
				var sError = serverError.create(resource);
				sError.setRequest(requestObj);
				sError.setResponse(responseObj);
				return sError.handle(error, status);
			}
			logger.verbose('request hook #' + count + ' successfully executed (url:' + url + ')', '(request-id:' + resource.rawRequest.uniqueId + ')');
			next();
		});
	},
	function () {
		methodFunc(requestObj, responseObj);
	});
}
