var gracenode = require('../../gracenode');
var log = gracenode.log.create('server-router');
var router = require('request-router');
var EventEmitter = require('events').EventEmitter;

var config = null;
var rerouteMap = {};
var controllerMap = {};

module.exports = new EventEmitter();

module.exports.readConfig = function (configIn) {
	config = configIn;
	if (config && config.reroute && config.reroute.length) {
		// create map for rerouting
		for (var i = 0, len = config.reroute.length; i < len; i++) {
			var item = config.reroute[i];
			rerouteMap[item.from] = item.to;
		}

		router.setReroutes(rerouteMap);

		log.verbose('rerouting mapped:', rerouteMap);
	
	}
};

module.exports.setup = function (cb) {
	gracenode.lib.walkDir(config.controllerPath, function (error, list) {
		if (error) {
			return cb(error);
		}
		for (var i = 0, len = list.length; i < len; i++) {
			
			var paths = list[i].file.substring(0, list[i].file.lastIndexOf('.')).replace(config.controllerPath, '').split('/');
			var map = controllerMap;
			for (var j = 0, jen = paths.length; j < jen; j++) {
				if (!map[paths[j]]) {
					if (j != jen - 1) {
						map[paths[j]] = {};
					} else {
						map[paths[j]] = true;
					}
				}
				map = map[paths[j]];
			}

		}

		if (!Object.keys(controllerMap).length) {
			log.warning('there are no controllers in', config.controllerPath);
		}
		log.verbose('controllers and methods mapped:', controllerMap);
		cb();
	});
};

module.exports.getControllerMap = function () {
	return gracenode.lib.cloneObj(controllerMap);
};

module.exports.handle = function (url, res) {
	// check for ignored request
	if (config.ignored && isIgnoredRequest(config.ignored, url)) {
		
		log.verbose('request ignored:', url);

		// respond with 404 right away
		res.writeHead(404, {});
		res.end('');

		return null;
	}

	// apply URL prefix if given
	if (config.urlPrefix) {
		log.verbose('URL prefix is set:', config.urlPrefix, url);
		url = url.replace(config.urlPrefix, '/');
		log.verbose('URL prefix applied:', config.urlPrefix, url);
	}
	
	var parsedUrl = router.parse(url);
	
	// if there is no method in URL, gracenode will look for index.js
	if (!parsedUrl.method) {
		parsedUrl.method = 'index';
	}
	
	// check the controller map
	if (!controllerMap[parsedUrl.controller]) {
		parsedUrl.notFound = new Error('controller ' + parsedUrl.controller + ' not found');
	} else if (!controllerMap[parsedUrl.controller][parsedUrl.method]) {
		parsedUrl.notFound = new Error('controller method ' + parsedUrl.controller + '/' + parsedUrl.method + ' not found');
	}

	// support for subdirectories
	parsedUrl.subdir = '';
	if (!parsedUrl.notFound && parsedUrl.params.length) {
		var map = controllerMap[parsedUrl.controller][parsedUrl.method];
		var subdir = [];
		var params = [];
		for (var i = 0, len = parsedUrl.params.length; i < len; i++) {
			if (map[parsedUrl.params[i]]) {
				subdir.push(parsedUrl.params[i]);
				map = map[parsedUrl.params[i]];
			} else {
				params.push(parsedUrl.params[i]);
			}
		}
		if (subdir.length) {
			// subdirectory method found
			parsedUrl.subdir = '/' + subdir.join('/');
			// remove subdirectory path from params
			parsedUrl.params = params;
		}
	}
	
	log.verbose('request resolved:', parsedUrl);

	return parsedUrl;

};

function isIgnoredRequest(ignored, url) {
	if (Array.isArray(ignored) && ignored.indexOf(url) !== -1) {
		// ignored request detected
		return true;
	}
	return false;
}
