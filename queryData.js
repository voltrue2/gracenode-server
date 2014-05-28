module.exports.createGetter = function (dataObj) {
	var data = new Data(dataObj);
	return data;
};

function Data(dataIn) {
	this._data = dataIn || {};
}

Data.prototype.get = function (key) {
	return this._data[key] !== undefined ? this._data[key] : null;
};

Data.prototype.getAll = function () {
	var res = {};
	for (var key in this._data) {
		res[key] = this.get(key);
	}
	return res;
};
