module.exports = function(app, Host, _, io) {
	// Insert host
	app.post("/api/v1/hvac/host", function(req, res) {
		var body = _.pick(req.body, 'name');
		console.log("inserting host");
		console.log(body);
		Host.insert(body).then(function(result) {
			console.log("inserted host");
			res.status(201).json(result);
		}).catch(function(error) {
			console.log("error inserting host; " + error);
			res.status(500).json(error);
		});
	});

	// Get hosts
	app.get("/api/v1/hvac/host", function(req, res) {
		console.log("hosts requested");
		console.log("params: " + JSON.stringify(req.query));
		Host.get(req.query).then(function(results) {
			console.log("retrieved hosts");
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving hosts; " + error);
			res.status(500).json(error);
		});
	});

	// Update host
	app.put("/api/v1/hvac/host/:id", function(req, res) {
		var hostId = req.params.id;
		var body = _.pick(req.body, 'name');
		console.log("host " + hostId + " update requested");
		console.log(body);
		Host.update(hostId, body).then(function(results) {
			console.log("host " + hostId + "updated");
			res.json(results);
		}).catch(function(error) {
			console.log("host update error: " + error);
			res.status(500).json(error);
		});
	});

	// Delete host
	app.delete("/api/v1/hvac/host/:id", function(req, res) {
		var hostId = req.params.id;
		console.log("host " + hostId + " delete requested");
		Host.delete(hostId).then(function(results) {
			console.log("host " + hostId + "deleted");
			res.json(results);
		}).catch(function(error) {
			console.log("host delete error: " + error);
			res.status(500).json(error);
		});
	});

}