module.exports = function(app, Model, _, io) {
	// Insert model
	app.post("/api/v1/hvac/model", function(req, res) {
		var body = _.pick(req.body, 'name', 'manufacturer', 'temperature', 'humidity');
		console.log("inserting model");
		console.log(body);
		Model.insert(body).then(function(result) {
			console.log("inserted model");
			res.status(201).json(result);
		}).catch(function(error) {
			console.log("error inserting model; " + error);
			res.status(500).json(error);
		});
	});

	// Get models
	app.get("/api/v1/hvac/model", function(req, res) {
		console.log("models requested");
		console.log("params: " + JSON.stringify(req.query));
		Model.get(req.query).then(function(results) {
			console.log("retrieved models");
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving models; " + error);
			res.status(500).json(error);
		});
	});

	// Update model
	app.put("/api/v1/hvac/model/:id", function(req, res) {
		var modelId = req.params.id;
		var body = _.pick(req.body, 'name', 'manufacturer', 'temperature', 'humidity');
		console.log("model " + modelId + " update requested");
		console.log(body);
		Model.update(modelId, body).then(function(results) {
			console.log("model " + modelId + " updated");
			res.json(results);
		}).catch(function(error) {
			console.log("model update error: " + error);
			res.status(500).json(error);
		});
	});

	// Delete model
	app.delete("/api/v1/hvac/model/:id", function(req, res) {
		var modelId = req.params.id;
		console.log("model " + modelId + " delete requested");
		Model.delete(modelId).then(function(results) {
			console.log("model " + modelId + " deleted");
			res.json(results);
		}).catch(function(error) {
			console.log("model delete error: " + error);
			res.status(500).json(error);
		});
	});

}