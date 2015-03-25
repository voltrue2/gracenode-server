var util = require('util');
var http = require('http');
var EventEmitter = require('events').EventEmitter;

var gracenode = require('../gracenode');
var log = gracenode.log.create('server-http');

var config = null;

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.host || !configIn.port) {
		throw new Error('invalid configurations:\n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.start = function (requestHandler) {
	return new Http(requestHandler);	
};

function Http(requestHandler) {
	EventEmitter.call(this);
	var that = this;
	
	this.server = http.createServer(function (req, res) {
		requestHandler(req, res);
	});

	this.server.on('listening', function () {
		log.info('server started:', config.host + ':' + config.port);
	});
	
	this.server.on('error', function (error) {
		log.error('server failed:', config.host + ':' + config.port);
		gracenode.exit(error);
	});

	this.server.listen(config.port, config.host);

	// listener for gracenode shutdown
	gracenode.registerShutdownTask('http-server', function (callback) {
		try {
			log.info('stopping server...');
			that.server.close();
			log.info('server stopped gracefully: ' + config.host + ':' + config.port);
			callback();
		} catch (e) {
			if (e.message === 'Not running') {
				log.verbose(e.message);
				return callback();
			}
			callback(e);
		}
	});

	log.info('server starting:', config.host + ':' + config.port);
}

util.inherits(Http, EventEmitter);
