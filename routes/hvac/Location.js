module.exports = function(app, Location, _, io) {
	// Insert location
	app.post("/api/v1/hvac/location", function(req, res) {
		var body = _.pick(req.body, 'floor', 'room', 'note', 'systemId');
		console.log("inserting location");
		console.log(body);
		Location.insert(body).then(function(result) {
			console.log("inserted location");
			res.status(201).json(result);
		}).catch(function(error) {
			console.log("error inserting location; " + error);
			res.status(500).json(error);
		});
	});

	// Get locations
	app.get("/api/v1/hvac/location", function(req, res) {
		console.log("locations requested");
		console.log("params: " + JSON.stringify(req.query));
		Location.get(req.query).then(function(results) {
			console.log("retrieved locations");
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving all locations; " + error);
			res.status(500).json(error);
		});
	});

	// Update location
	app.put("/api/v1/hvac/location/:id", function(req, res) {
		var locationId = req.params.id;
		var body = _.pick(req.body, 'floor', 'room', 'note', 'systemId');
		console.log("location " + locationId + " update requested");
		console.log(body);
		Location.update(locationId, body).then(function(results) {
			console.log("location " + locationId + " updated");
			res.json(results);
		}).catch(function(error) {
			console.log("location update error: " + error);
			res.status(500).json(error);
		});
	});

	// Delete location
	app.delete("/api/v1/hvac/location/:id", function(req, res) {
		var locationId = req.params.id;
		console.log("location " + locationId + " delete requested");
		Location.delete(locationId).then(function(results) {
			console.log("location " + locationId + " deleted");
			res.json(results);
		}).catch(function(error) {
			console.log("location delete error: " + error);
			res.status(500).json(error);
		});
	});

}