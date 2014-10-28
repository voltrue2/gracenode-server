var assert = require('assert');
var gn = require('gracenode');
var request = require('./request');
var prefix = require('./prefix');
var http = 'http://localhost';
var https = 'https://localhost';

var options = {
	gzip: true
};

var hookTest1 = function (req, done) {
	var result = req.data('result');
	if (result === 'success') {
		return done();
	} else {
		return done(new Error('failed'), 403);
	}
};

var hookTest2 = function (req, done) {
	var result = req.data('result');
	if (result === 'success') {
		return done();
	} else {
		return done(new Error('failed'), 403);
	}
};

var success = function (req, done) {
	assert(req);
	done();
};

var failure = function (req, done) {
	assert(req);
	done(new Error('failed'), 400);
};

describe('gracenode server module ->', function () {

	console.log('*** NOTICE: This test requires gracenode installed in the same directory as this module.');
	console.log('*** NOTICE: This test requires gracenode-request installed in the same directory as this module.');

	/*
	it('Can start HTTPS server', function (done) {
		
		gn.setConfigPath(prefix + 'gracenode-server/test/configs/');
		gn.setConfigFiles(['index.json', 'https.json']);

		gn.on('setup.config', function () {
			var conf = gn.config.getOne('modules.gracenode-server');
			conf.pemKey = prefix + conf.pemKey;
			conf.pemCert = prefix + conf.pemCert;
			conf.controllerPath = prefix + conf.controllerPath;
		});

		gn.use('gracenode-request');
		gn.use('gracenode-server');

		gn.setup(function (error) {
			assert.equal(error, undefined);
			gn.server.addRequestHooks({
				hook: hookTest1
			});
			https += ':' + gn.config.getOne('modules.gracenode-server.port');
			gn.server.start();
			done();
		});
	});
	*/

	it('Can start HTTP server', function (done) {
		
		gn.setConfigPath(prefix + 'gracenode-server/test/configs/');
		gn.setConfigFiles(['http.json']);

		gn.use('gracenode-request');
		gn.use('gracenode-server');

		gn.on('setup.config', function () {
			var conf = gn.config.getOne('modules.gracenode-server');
			conf.pemKey = prefix + conf.pemKey;
			conf.pemCert = prefix + conf.pemCert;
			conf.controllerPath = prefix + conf.controllerPath;
		});

		gn.setup(function (error) {
			assert.equal(error, undefined);
			http += ':' + gn.config.getOne('modules.gracenode-server.port');
			var logger = gn.log.create('all request hook');
			var logger2 = gn.log.create('all response hook');
			gn.server.addRequestHooks(function (req, next) {
				logger.debug('all request hook called');
				next();
			});
			gn.server.addRequestHooks({
				hook: [hookTest1, hookTest2, function (req, callback) {
					assert.equal(req.controller, 'hook');
					callback();
				}],
				hook2: {
					failed: hookTest2
				},
				test: {
					get: function (req, callback) {
						assert.equal(req.controller, 'test');
						assert.equal(req.method, 'get');
						callback();
					},
					sub: {
						sub2: {
							index: function (req, callback) {
								req.set('key', 'sub2/index');
								callback();
							},
							foo: function (req, callback) {
								req.set('key', 'sub2/foo');
								console.log(req.controller, req.method);
								callback();
							}
						},
						index: function (req, callback) {
							req.set('key', 'index');
							console.log('request hook for test/sub/index');
							callback();
						}
					}
				}
			});
			gn.server.addResponseHooks(function (req, next) {
				logger2.debug('all response hook called:', req.url);
				next();
			});
			gn.server.addResponseHooks({
				hook: [success, success, success],
				hook3: {
					index: failure
				},
				test: {
					sub: {
						index: function (req, callback) {
							console.log('response hook on subdirectoried method test/sub/index', req.controller, req.method);
							callback();
						},
						sub2: {
							foo: function (req, callback) {
								console.log('response hook for test/sub/sub2/foo');
								callback();
							}
						}
					}
				}
			});
			var controllerMap = gn.server.getControllerMap();
			
			console.log(controllerMap);

			gn.server.start();
			done();
		});
	});

	it('Can handle a GET request', function (done) {
		var args = {
			boo: 'BOO',
			foo: 'FOO'
		};
	
		request.GET(http + '/test/get/one/two/three', args, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.boo, args.boo);
			assert.equal(body.foo, args.foo);
			assert.equal(body.parameters[0], 'one');
			assert.equal(body.parameters[1], 'two');
			assert.equal(body.parameters[2], 'three');
			done();
		});
	});
	
	it('Can read sent data correctly with the correct data type', function (done) {
		var args = {
			boo: JSON.stringify([1])
		};
	
		request.GET(http + '/test/get2', args, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body.boo[0], 1);
			done();
		});
	});
	
	it('Can read the sent data literally', function (done) {
		var list = JSON.stringify({a:10,b:'BB',c:'100'});
		request.POST(http + '/test/post2', { list: list }, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body, list);
			done();
		});
	});

	it('Can handle a HEAD request (controller expects HEAD)', function (done) {
		var args = {
			boo: 'BOO',
			foo: 'FOO'
		};
	
		request.HEAD(http + '/test/head', args, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			done();
		});
	});

	it('Can ignore a request', function (done) {
		request.GET(http + '/ignore/me', {}, options, function (error, body, status) {
			assert.equal(status, 404);
			done();
		});
	});

	it('Can handle a POST request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.POST(http + '/test/post', args, options, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});

	it('Can handle a PUT request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.PUT(http + '/test/put', args, options, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, args.boo);
			done();
		});
	});
	
	it('Can handle a DELETE request', function (done) {
		var args = {
			boo: 'BOO',
		};
	
		request.DELETE(http + '/test/delete', args, options, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});

	it('Can respond with 404 on none existing URI', function (done) {
		request.GET(http + '/blah', {}, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 404);
			done();
		});
	});

	it('Can reroute a request from /take/me to /land/here', function (done) {
		request.GET(http + '/take/me', {}, options, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});
	
	it('Can reroute a request from / to /land/here', function (done) {
		request.GET(http, {}, options, function (error, body) {
			assert.equal(error, undefined);
			assert.equal(body, 'land/here');
			done();
		});
	});

	it('Can reject wrong request method', function (done) {
		request.POST(http + '/test/get2', {}, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 400);
			assert.equal(body, '/test/get2 does not accept "POST"');
			done();
		});
	});

	it('Can execute pre-defined error controller on error status 500', function (done) {
		request.GET(http + '/test/errorOut', {}, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 500);
			assert.equal(body, 'internal error');
			done();
		});		
	});

	it('Can execute pre-assigned error controller on error status 404', function (done) {
		// we hack configs
		gn.config.getOne('modules.gracenode-server').error['404'] = {
			controller: 'error',
			method: 'notFound'
		};
		request.GET(http + '/iAmNotHere', {}, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 404);
			assert.equal(body, 'not found');
			done();
		});		
	});

	it('Can auto look-up index.js for a request /test/', function (done) {
		request.GET(http + '/test', {}, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body, 'index');
			done();
		});
	});

	it('Can pass request hook', function (done) {
		request.POST(http + '/hook/success', { result: 'success' }, options, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});
	
	it('Can fail request hook', function (done) {
		request.POST(http + '/hook/failed', { result: 'failed' }, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 403);
			assert.equal(body, 'failed');
			done();
		});
	});
	
	it('Can fail request hook and execute pre-defined error controller', function (done) {
		// we hack configs
		gn.config.getOne('modules.gracenode-server').error['403'] = {
			controller: 'error',
			method: 'unauthorized'
		};
		request.POST(http + '/hook2/failed', { result: 'failed' }, options, function (error, body, status) {
			assert(error);
			assert.equal(status, 403);
			assert.equal(body, 'pre-defined fail');
			done();
		});
	});
	
	it('Can pass response hook', function (done) {
		request.POST(http + '/hook/success', { result: 'success' }, options, function (error, body) {
			assert.equal(error, undefined);
			done();
		});
	});
	
	it('Can fail response hook', function (done) {
		request.GET(http + '/hook3/index', { result: 'success' }, options, function (error, body, status) {
			assert(error);
			assert.equal(body, 'failed');
			assert.equal(status, 400);
			done();
		});
	});
	
	it('Can catch double responses', function (done) {
		request.GET(http + '/test/double', {}, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(body.state, 'ok');
			done();
		});
	});

	it('Can handle a HEAD request', function (done) {
		var args = {
			boo: 'BOO',
			foo: 'FOO'
		};
	
		request.HEAD(http + '/test/get2/one/two/three', args, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body, '');
			done();
		});
		
	});

	it('Can not call response.error() more than once', function (done) {
		request.GET(http + '/test/get3', null, options, function (error, body, status) {
			done();
		});
	});

	it('Can read pre-defined paramters by names', function (done) {
		request.GET(http + '/test/params/foo/boo', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.one, 'foo');
			assert.equal(body.two, 'boo');
			done();
		});
	});

	it('Can handle sub directories from the request /test/sub', function (done) {
		request.GET(http + '/test/sub', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'index');
			done();
		});
	});

	it('Can handle sub directories from the request /test/sub/call', function (done) {
		request.GET(http + '/test/sub/call', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'call');
			done();
		});
	});

	it('Can handle sub directories from the request /test/sub/sub2', function (done) {
		request.GET(http + '/test/sub/sub2', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/index');
			done();
		});
	});

	it('Can handle sub directories from the request /test/sub/sub2/foo', function (done) {
		request.GET(http + '/test/sub/sub2/foo', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/foo');
			done();
		});
	});

	it('Can handle sub directories from the request /test/sub/index/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/index/one/two', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'index');
			assert.equal(body.params[0], 'one');
			assert.equal(body.params[1], 'two');
			assert.equal(body.key, 'index');
			done();
		});
	});

	it('Can handle sub directories from the request /test/sub/call/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/call/one/two', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'call');
			assert.equal(body.params[0], 'one');
			assert.equal(body.params[1], 'two');
			done();
		});
	});

	it('Can handle sub directories from the request /test/sub/sub2/index/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/sub2/index/one/two', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/index');
			assert.equal(body.params[0], 'one');
			assert.equal(body.params[1], 'two');
			assert.equal(body.key, 'sub2/index');
			done();
		});
	});

	it('Can handle sub directories from the request /test/sub/sub2/foo/one/two with parameters', function (done) {
		request.GET(http + '/test/sub/sub2/foo/one/two', null, options, function (error, body, status) {
			assert.equal(error, undefined);
			assert.equal(status, 200);
			assert.equal(body.method, 'sub2/foo');
			assert.equal(body.params[0], 'one');
			assert.equal(body.params[1], 'two');
			assert.equal(body.key, 'sub2/foo');
			done();
		});
	});

});
