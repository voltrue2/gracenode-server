var fs = require('fs');
var gracenode = require('../../gracenode');
var logger = gracenode.log.create('server-request');
var queryDataHandler = require('./queryData');
var headers = require('./headers');
var mime = require('./mime');
var Cookies = require('cookies');
var queryString = require('querystring');
var url = require('url');
var multiparty = require('multiparty');

module.exports = Request;

function Request(request, response, reqObj) {
	// private
	this._props = {};
	this._response = response;
	this._request = request;
	this._method = request.method;
	this._paramMap = {};
	
	// public
	this.requestId = request.uniqueId;
	this.url = request.url;
	this.controller = reqObj.controller;
	this.method = reqObj.method + reqObj.subdir;
	this.parameters = reqObj.params;
	this.headers = headers.create(request.headers);
}

Request.prototype.setup = function (cb) {
	var that = this;
	this.extractQueries(this._request, function (error, dataHandler) {
		if (error) {
			return cb(error);
		}
		that._dataHandler = dataHandler;

		logger.info('request:', that._method, that.url, '(request-id:' + that._request.uniqueId +')', that._request.headers);
		logger.verbose('request data:', that._method, that.url, '(request-id:' + that._request.uniqueId + ')', that._dataHandler.getAll());

		cb(null, that);
	});
};

// called from controller as an option
Request.prototype.setParamMap = function (paramList) {
	for (var i = 0, len = paramList.length; i < len; i++) {
		this._paramMap[paramList[i]] = i;
	}
};

Request.prototype.getParam = function (key) {
	if (this._paramMap[key] !== undefined) {
		var index = this._paramMap[key];
		if (this.parameters[index] !== undefined) {
			return this.parameters[index];
		}
	}
	return null;
};

Request.prototype.moveUploadedFile = function (path, destPath, cb) {
	logger.verbose('moving a file from', '[' + path + ']', 'to', '[' + destPath + ']');
	fs.rename(path, destPath, cb);
};

Request.prototype.getUploadedFileData = function (path, cb) {
	logger.verbose('reading a file data from [' + path + ']');
	fs.readFile(path, 'utf8', function (error, data) {
		if (error) {
			return cb(error);
		}
		// remove the file
		fs.unlink(path, function (error) {
			if (error) {
				return cb(error);
			}
			logger.verbose('removing the file from [' + path + ']');
			cb(null, data);
		});
	});
};

Request.prototype.cookies = function () {
	return new Cookies(this._request, this._response);
};

Request.prototype.getMethod = function () {
	return this._method;
};

Request.prototype.set = function (name, value) {
	this._props[name] = value;
};

Request.prototype.get = function (name) {
	if (this._props[name] === undefined) {
		return null;
	}
	return gracenode.lib.cloneObj(this._props[name]);
};

/*
literal: <boolean> if true, we skip JSON.parse to keep the data type a original
default is false
*/
Request.prototype.data = function (key, literal) {
	return this._dataHandler.get(key, literal);
};

Request.prototype.dataAll = function () {
	return this._dataHandler.getAll();
};

Request.prototype.extractQueries = function (req, cb) {
	if (mime.is(req.headers, 'multipart')) {
		var form = new multiparty.Form();
		form.parse(req, function (error, fields, files) {
			if (error) {
				return cb(error);
			}
			var obj   = fields;
			obj.files = [];
			for (var f in files) {
				obj.files.push(files[f][0]);
			}
			cb(null, queryDataHandler.createGetter(obj));
		});
		return;
	}
	switch (req.method) {
		case 'POST':
		case 'PUT':
		case 'DELETE':
			extractReqData(req, cb);
			break;
		case 'GET':
		case 'HEAD':
			extractReqGETData(req, cb);
			break;
		default:
			logger.warning('only POST, PUT, DELETE, HEAD, and GET are supported');
			cb(null, queryDataHandler.createGetter({}));
			break;
	}
};

function extractReqData(req, cb) {
	var body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end', function () {
		var data = readRequestBody(req.url, req.headers, body);
		cb(null, queryDataHandler.createGetter(data));
	});
	req.on('error', function (error) {
		cb(error);
	});
}

function extractReqGETData(req, cb) {
	var parsed = url.parse(req.url, true);
	var getBody = '';
	req.on('data', function (data) {
		getBody += data;
	});
	req.on('end', function () {
		var get = queryString.parse(getBody);
		// type case for GET queries
		for (var name in get) {
			get[name] = gracenode.lib.typeCast(get[name]);
		}
		for (var key in parsed.query) {
			get[key] = gracenode.lib.typeCast(parsed.query[key]);
		}
		cb(null, queryDataHandler.createGetter(get));
	});
}

function readRequestBody(url, headers, body) {
	var reqBody;
	if (mime.is(headers, 'json')) {
		try {
			reqBody = JSON.parse(body);
		} catch (e) {
			logger.error('Invalid JSON in request: (url:' + url + ')', body, e);
			reqBody = {};
		}
	} else {
		reqBody = queryString.parse(body);
		for (var key in reqBody) {
			reqBody[key] = gracenode.lib.typeCast(reqBody[key]);
		}
	}

	return reqBody;
}
