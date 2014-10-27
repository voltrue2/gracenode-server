exports.GET = function (req, res) {
	res.json({ method: 'sub2/foo', params: req.parameters });
};
