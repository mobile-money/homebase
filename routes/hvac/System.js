module.exports = function(app, System, _, io) {
	// Insert system
	app.post("/api/v1/hvac/system", function(req, res) {
		var body = _.pick(req.body, 'name', 'type', 'controlPin', 'state');
		console.log("inserting system");
		console.log(body);
		System.insert(body).then(function(result) {
			console.log("inserted system");
			res.status(201).json(result);
		}).catch(function(error) {
			console.log("error inserting system; " + error);
			res.status(500).json(error);
		});
	});

	// Get systems
	app.get("/api/v1/hvac/system", function(req, res) {
		console.log("systems requested");
		console.log("params: " + JSON.stringify(req.query));
		System.get(req.query).then(function(results) {
			console.log("retrieved systems");
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving systems; " + error);
			res.status(500).json(error);
		});
	});

	// Update system
	app.put("/api/v1/hvac/system/:id", function(req, res) {
		var systemId = req.params.id;
		var body = _.pick(req.body, 'name', 'type', 'controlPin', 'state');
		console.log("system " + systemId + " update requested");
		System.update(systemId, body).then(function(results) {
			console.log("system " + systemId + " updated");
			res.json(results);
		}).catch(function(error) {
			console.log("system update error: " + error);
			res.status(500).json(error);
		});
	});

	// Delete system
	app.delete("/api/v1/hvac/system/:id", function(req, res) {
		var systemId = req.params.id;
		console.log("system " + systemId + " delete requested");
		System.delete(systemId).then(function(results) {
			console.log("system " + systemId + " deleted");
			res.json(results);
		}).catch(function(error) {
			console.log("system delete error: " + error);
			res.status(500).json(error);
		});
	});
};