exports.GET = function (req, res) {
	res.json({ method: 'index', params: req.parameters });
};
