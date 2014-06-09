var gn = require('gracenode');
var logger = gn.log.create('test/post2');

module.exports.POST = function (req, res) {
	var list = req.data('list');

	logger.debug('list', list);

	res.json(list);
};
