exports.GET = function (req, res) {
	res.header('Cache-Control', 'private, max-age=6000');
	res.json('hello');
};
