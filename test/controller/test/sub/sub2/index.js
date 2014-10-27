exports.params = [
	'one',
	'two'
];

exports.GET = function (req, res) {
	res.json({ method: 'sub2/index', params: req.parameters });
};
