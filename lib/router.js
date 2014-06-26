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
			var sep = list[i].file.replace(config.controllerPath, '').split('/');
			if (sep[0] && sep[1]) {
				var controller = sep[0];
				var method = sep[1].substring(0, sep[1].lastIndexOf('.'));
				if (!controllerMap[controller]) {
					controllerMap[controller] = {};
				}
				controllerMap[controller][method] = true;
			}
		}
		if (!Object.keys(controllerMap).length) {
			log.warning('there are no controllers in', config.controllerPath);
		}
		log.verbose('controllers and methods mapped:', controllerMap);
		cb();
	});
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
