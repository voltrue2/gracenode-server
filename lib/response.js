var gracenode = require('../../gracenode');
var log = gracenode.log.create('server-response');
var hook = require('../hooks/response');
var zlib = require('zlib');
var mime = require('./mime');
var defaultHeaders = {
	'Cache-Control': 'no-cache, must-revalidate',
	'Connection': 'Keep-Alive',
	'Content-Encoding': 'gzip',
	'Pragma': 'no-cache', // for old client that does not support cache-control header
	'Vary': 'Accept-Encoding',
};

module.exports.create = function (resource, requestObj) {
	return new Response(resource, requestObj);
};

function Response(resource, requestObj) {
	this._resource = resource;
	this._requestObj = requestObj;
	this._defaultStatus = 200;
	this._resHeaders = {};
	for (var name in defaultHeaders) {
		this._resHeaders[name] = defaultHeaders[name];
	}
}

Response.prototype.getRequest = function () {
	return this._requestObj;
};

Response.prototype.header = function (name, value) {
	if (value === null || value === undefined) {
		delete this._resHeaders[name];
		return;
	}
	this._resHeaders[name] = value;
};

Response.prototype.json = function (content, status) {
	log.verbose('response content type: JSON');
	this.respond(this._resHeaders, respondJSON, content, status);
};

Response.prototype.html = function (content, status) {
	log.verbose('response content type: HTML');
	this.respond(this._resHeaders, respondHTML, content, status);
};

Response.prototype.data = function (content, status) {
	log.verbose('response content type: Data');
	this.respond(this._resHeaders, respondData, content, status);
};

Response.prototype.file = function (content, status) {
	log.verbose('response content type: File');
	delete this._resHeaders['Content-Encoding'];
	this.respond(this._resHeaders, respondFILE, content, status);
};

Response.prototype.error = function (content, status) {
	this._errorHandler(content, status);
};

Response.prototype.download = function (content, fileName, status) {
	var fileType = fileName.substring(fileName.lastIndexOf('.') + 1);
	log.verbose('response content type:', fileType);

	this.header('Content-Disposition', 'attachment; filename=' + fileName);
	this.header('Content-Type', mime.get(fileType));
	
	this.respond(this._resHeaders, respondDownload, content, status);

};

Response.prototype.redirect = function (content, status) {
	log.verbose('response content type: Redirect');
	this.respond(this._resHeaders, respondRedirect, content, status || 307);
};

// internal use only
Response.prototype._setDefaultStatus = function (status) {
	this._defaultStatus = status;
};

Response.prototype.respond = function (headers, respondFunc, content, status) {
	// check for duplicated response
	if (this._resource.responded) {
		var rawReq = this._resource.rawRequest;
		var dupResError = new Error(
			'responded more than once: (url:' + rawReq.url + ') (request-id:' + rawReq.uniqueId + ')'
		);
		log.error(dupResError, 'content:', content, 'stauts:', (status || 200));
		// do not send response to the client anymore
		return;
	}

	var that = this;
	hook.exec(this, function () {
		// this callback will NOT be executed on error of the hook
		// now respond
		setupFinish(
			that._resource.rawRequest,
			that._resource.rawResponse,
			that._resource.server,
			that._resource.startTime
		);
		respondFunc(
			headers,
			that._resource.rawRequest,
			that._resource.rawResponse,
			content, status || that._defaultStatus
		);
		finish(that._resource.rawRequest, that._resource.rawResponse, that._resource.server);
		that._resource.responded = true;
	});
};

// overrriden by controller
Response.prototype._errorHandler = function () {

};

Response.prototype._error = function (content, status) {
	this.respond(this._resHeaders, respondERROR, content, status);
};

// sets up events for response finish. The events will be called when the request response has all been sent.
function setupFinish(req, res, server, startTime) {
	// this will be called when the server sends the response data and finishes it.
	res.once('finish', function () {
		var execTime = Date.now() - startTime;
		var msg = 'request responded: (url:' + req.url + ') (request-id:' + req.uniqueId;
		msg += ') (took:' + execTime + 'ms) (status:' + res.statusCode + ')';
		if (res.statusCode > 399) {
			log.error(msg);	
		} else {
			log.info(msg);
		}
		server.emit('requestFinish', req.url, execTime, res.statusCode);
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
		log.verbose(
			'compressed content size: (url:' + req.url + ') ' + (compressedData.length / 1024) + ' KB'
		);

		cb(null, compressedData);
	});
}

// this function does NOT allow to overwrite headers object
function setupHeaders(res, status, headers, additionalHeaders) {
	for (var name in additionalHeaders) {
		if (!headers.hasOwnProperty(name)) {
			headers[name] = additionalHeaders[name];
		}
	}
	res.writeHead(status, headers);
}

function respondJSON(headers, req, res, content, status) {
	content = content || null;
	compressContent(req, JSON.stringify(content), function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url, + ')', error);
			status = 500;
			data = error;
		}
		
		setupHeaders(res, status, headers, {
			'Content-Type': 'application/json; charset=UTF-8',
			'Cache-Control': 'no-cache, must-revalidate',
			'Content-Length': data.length
		});

		sendResponse(req, res, data, 'binary');		

	});

}

function respondHTML(headers, req, res, content, status) {
	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url, + ')', error);
			status = 500;
			data = error;
		}

		setupHeaders(res, status, headers, {
			'Content-Type': 'text/html; charset=UTF-8',
			'Content-Length': data.length
		});

		sendResponse(req, res, data, 'binary');		

	});
}

function respondData(headers, req, res, content, status) {
	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url + ')', error);
			status = 500;
			data = error;
		}
		
		setupHeaders(res, status, headers, {
			'Content-Type': 'text/plain; charset=UTF-8',
			'Content-Length': data.length
		});

		sendResponse(req, res, data, 'binary');		

	});
}

function respondDownload(headers, req, res, content, status) {

	content = content || null;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('compression error: (url:' + req.url + ')', error);
			status = 500;
			data = error;
		}
		
		setupHeaders(res, status, headers, {
			'Content-Length': data.length
		});

		sendResponse(req, res, data, 'binary');		

	});
}

function respondRedirect(headers, req, res, content, status) {
	content = content || null;
	
	// content needs to be redirect URL
	setupHeaders(res, status, headers, {
		'Location': content
	});

	log.verbose('redirect to: ', content);

	res.end();
}

function respondFILE(headers, req, res, content, status) {
	content = content || null;
	var type = req.url.substring(req.url.lastIndexOf('.') + 1);
	var contentSize = content.length;
	
	setupHeaders(res, status, headers, {
		'Content-Length': contentSize,
		'Content-Type': mime.get(type)
	});
	
	log.verbose('response content size: (url:' + req.url + ') ' + (contentSize / 1024) + ' KB');

	sendResponse(req, res, content, 'binary');

}

function respondERROR(headers, req, res, content, status) {
	var contentType = 'text/plain; charset=UTF-8';
	content = content || null;
	if (content !== null && typeof content === 'object') {
		content = JSON.stringify(content);
		contentType = 'application/json; charset=UTF-8';
	}
	status = status || 400;
	compressContent(req, content, function (error, data) {
		
		if (error) {
			log.error('(url:' + req.url + ')', error);
			status = 500;
			data = error;
		}

		var contentSize = data.length;
		
		setupHeaders(res, status, headers, {
			'Content-Type': contentType,
			'Content-Length': data.length
		});

		log.verbose('response content size: (url:' + req.url + ') ' + (contentSize / 1024) + ' KB');
	
		sendResponse(req, res, data, 'binary');

	});
}

function sendResponse(req, res, data, type) {
	// send and end the response
	if (req.method === 'HEAD') {
		// we do not send response content with HEAD request method
		return res.end('', 'binary');
	}
	log.verbose('response headers:', res._header);
	res.end(data, type);
}
