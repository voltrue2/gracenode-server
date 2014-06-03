var gracenode = require('../gracenode');
var log = gracenode.log.create('server-response');
var hook = require('./responseHook');
var zlib = require('zlib');
var mime = require('./mime');

module.exports.create = function (resource, requestObj) {
	return new Response(resource);
};

function Response(resource, requestObj) {
	this._resource = resource;
	this._requestObj = requestObj;
	this._defaultStatus = 200;
}

Response.prototype.header = function (name, value) {
	this._resource.rawResponse.setHeader(name, value);
};

Response.prototype.json = function (content, status) {
	log.verbose('response content type: JSON');
	this.respond(null, respondJSON, content, status);
};

Response.prototype.html = function (content, status) {
	log.verbose('response content type: HTML');
	this.respond(null, respondHTML, content, status);
};

Response.prototype.data = function (content, status) {
	log.verbose('response content type: Data');
	this.respond(null, respondData, content, status);
};

Response.prototype.file = function (content, status) {
	log.verbose('response content type: File');
	this.respond(null, respondFILE, content, status);
};

Response.prototype.error = function (content, status) {
	this._errorHandler(content, status);
};

Response.prototype.download = function (content, fileName, status) {
	var fileType = fileName.substring(fileName.lastIndexOf('.') + 1);
	log.verbose('response content type:', fileType);
	this.respond({ 'Content-Disposition': 'attachment; filename=' + fileName }, respondDownload, content, status);
};

Response.prototype.redirect = function (content) {
	log.verbose('response content type: Redirect');
	this.respond(null, respondRedirect, content, 307);
};

// internal use only
Response.prototype._setDefaultStatus = function (status) {
	this._defaultStatus = status;
};

Response.prototype.respond = function (headers, respondFunc, content, status) {
	var that = this;
	hook.exec(this, function () {
		// this callback will NOT be executed on error of the hook
		for (var headerName in headers) {
			that.header(headerName, headers[headername]);
		}
		setupFinish(that._resource.rawRequest, that._resource.rawResponse, that._resource.server, that._resource.startTime);
		respondFunc(that._resource.rawRequest, that._resource.rawResponse, content, status || that._defaultStatus);
		finish(that._resource.rawRequest, that._resource.rawResponse, that._resource.server);
	});
};

// overrriden by controller
Response.prototype._errorHandler = function () {

};

Response.prototype._error = function (content, status) {
	log.verbose('response content type: Error');
	setupFinish(this._resource.rawRequest, this._resource.rawResponse, this._resource.server, this._resource.startTime);
	respondERROR(this._resource.rawRequest, this._resource.rawResponse, content, status);
	finish(this._resource.rawRequest, this._resource.rawResponse, this._resource.server);
};

// sets up events for response finish. The events will be called when the request response has all been sent.
function setupFinish(req, res, server, startTime) {
	// this will be called when the server sends the response data and finishes it.
	res.once('finish', function () {
		var execTime = Date.now() - startTime;
		var msg = 'request responded: (url:' + req.url + ') (took:' + execTime + 'ms) (status:' + res.statusCode + ')';
		if (res.statusCode > 399) {
			log.error(msg);	
		} else {
			log.info(msg);
		}
		server.emit('requestFinish', req.url, execTime);
	});
}

function finish(req, res, server) {
	res.emit('end', req.url);
	// this will be called when the server finishes all operation (not when the response data sent)
	server.emit('requestEnd', req.url);
}

function compressContent(req, content, cb) {
	if (content instanceof Buffer) {
		// we do not compress binary
		log.verbose('skip compressing binary data: (url:' + req.url + ') ' + (content.length / 1024) + 'KB');
		cb(null, content);
	}
	zlib.gzip(content, function (error, compressedData) {
		if (error) {
			return cb(error);
		}
		log.verbose('compressed content size: (url:' + req.url + ') ' + (compressedData.length / 1024) + ' KB');

		cb(null, compressedData);
	});
}

function respondJSON(req, res, content, status) {
	content = content || null;
	compressContent(req, JSON.stringify(content), function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url, + ')', error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'application/json; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		res.end(data, 'binary');		

	});

}

function respondHTML(req, res, content, status) {
	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url, + ')', error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/html; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		res.end(data, 'binary');		

	});
}

function respondData(req, res, content, status) {
	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url + ')', error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/plain; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		res.end(data, 'binary');		

	});
}

function respondDownload(req, res, content, type, status) {
	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url + ')', error);
			status = 500;
			data = error;
		}

		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': mime.get(type) + '; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});

		res.end(data, 'binary');		

	});
}

function respondRedirect(req, res, content) {
	content = content || null;
	var status = 301;
	// content needs to be redirect URL
	res.writeHead(status, {
		Location: content
	});
	
	log.verbose('redirect to: ', content);

	res.end();
}

function respondFILE(req, res, content, status) {
	content = content || null;
	var type = req.url.substring(req.url.lastIndexOf('.') + 1);
	var contentSize = content.length;
	res.writeHead(status, {
		'Content-Length': contentSize,
		'Content-Type': mime.get(type)
	});
	
	log.verbose('response content size: (url:' + req.url + ') ' + (contentSize / 1024) + ' KB');

	res.end(content, 'binary');

}

function respondERROR(req, res, content, status) {
	var contentType = 'text/plain';
	content = content || null;
	if (content !== null && typeof content === 'object') {
		content = JSON.stringify(content);
		contentType = 'application/json';
	}
	status = status || 400;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('(url:' + req.url + ')', error);
			status = 500;
			data = error;
		}

		var contentSize = data.length;
		res.writeHead(status, {
			'Cache-Control': 'no-cache, must-revalidate',
			'Connection': 'Keep-Alive',
			'Content-Encoding': 'gzip',
			'Content-Type': contentType + '; charset=UTF-8',
			'Pragma': 'no-cache',
			'Vary': 'Accept-Encoding',
			'Content-Length': data.length
		});
		
		log.verbose('response content size: (url:' + req.url + ') ' + (contentSize / 1024) + ' KB');
	
		res.end(data, 'binary');

	});
}
