var fs = require('fs');
var util = require('util');
var https = require('https');
var EventEmitter = require('events').EventEmitter;

var gracenode = require('../gracenode');
var log = gracenode.log.create('server-https');

var config = null;
var options = {};

module.exports.readConfig = function (configIn) {
	if (!configIn || !configIn.host || !configIn.port || !configIn.pemKey || !configIn.pemCert) {
		throw new Error('invalid configurations:\n' + JSON.stringify(configIn, null, 4));
	}
	config = configIn;
};

module.exports.setup = function (cb) {
	var list = [config.pemKey, config.pemCert];

	log.verbose('setting up ssl server:', list);

	log.verbose('loading key pem file:', config.pemKey);
	fs.readFile(config.pemKey, 'utf8', function (error, keyData) {
		if (error) {
			return cb(error);
		}
		options.key = keyData;
		log.verbose('key pem file loaded:', options.key);
		log.verbose('loading cert pem file:', config.pemCert);
		fs.readFile(config.pemCert, 'utf8', function (error, certData) {
			if (error) {
				return cb(error);
			}
			options.cert = certData;
			log.verbose('cert pem fiile loaded:', options.cert);
			
			cb();
		});
	});
};

module.exports.start = function (requestHandler) {
	return new Https(requestHandler);	
};

function Https(requestHandler) {
	EventEmitter.call(this);
	var that = this;

	log.verbose('starting the server with:', options);

	/**
	* Fix for Poodle BUG exploit
	* https://gist.github.com/3rd-Eden/715522f6950044da45d8
	*/
	if (config.secureOptions) {

		var constants = require('constants');

		if (constants[config.secureOptions]) {

			options.secureOptions = constants[config.secureOptions];

		} else {

			log.warn('Invalid secureOptions parameter given in config:', config.secureOptions);

		}
		
	}

	this.server = https.createServer(options, function (req, res) {
		requestHandler(req, res);
	});

	this.server.on('error', function (error) {
		log.error('server failed:', config.host + ':' + config.port);
		gracenode.exit(error);
	});

	this.server.listen(config.port, config.host);

	// listener for gracenode shutdown
	gracenode.registerShutdownTask('server-https', function (callback) {
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

	log.info('server started:', config.host + ':' + config.port);
}

util.inherits(Https, EventEmitter);
