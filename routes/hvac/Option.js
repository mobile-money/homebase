module.exports = function(app, Option, _, io) {
	// Get Options
	app.get("/api/v1/hvac/option", function(req, res) {
		console.log("options requested");
		Option.get().then(function(result) {
			console.log("options retrieved");
			res.status(200).json(result);
		}).catch(function(error) {
			console.log("error retrieving options; " + error);
			res.status(500).json(error);
		});
	});

	// Update Options
	app.put("/api/v1/hvac/option", function(req, res) {
		console.log("options update requested");
		var body = _.pick(req.body, 'upperBuffer', 'lowerBuffer', 'tempScale', 'defaultLocation');
		console.log(body);
		Option.update(body).then(function(results) {
			console.log("options updated");
			res.json(results);
		}).catch(function(error) {
			console.log("error updating options; " + error);
			res.status(500).json(error);
		});
	});
}