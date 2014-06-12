module.exports.createGetter = function (dataObj) {
	var data = new Data(dataObj);
	return data;
};

function Data(dataIn) {
	this._data = dataIn || {};
}

/*
literal: <boolean> if true, we skip JSON.parse so that we keep the data type
by default it is false
*/
Data.prototype.get = function (key, literal) {
	var res = this._data[key] !== undefined ? this._data[key] : null;
	if (literal) {
		return res;
	}
	if (res && typeof res === 'string') {
		try {
			res = JSON.parse(res);
		} catch (e) {
			// res is not JSON
		}
	}
	return res;
};

Data.prototype.getAll = function () {
	var res = {};
	for (var key in this._data) {
		res[key] = this.get(key);
	}
	return res;
};
