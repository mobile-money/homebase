module.exports = function(app, Sensor, _, io) {
	// Insert sensor
	app.post("/api/v1/hvac/sensor", function(req, res) {
		var body = _.pick(req.body, 'locationId', 'modelId', 'hostId', 'dataPin', 'enabled');
		console.log("inserting sensor");
		console.log(body);
		Sensor.insert(body).then(function(result) {
			console.log("sensor inserted");
			res.status(201).json(result);
		}).catch(function(error) {
			console.log("error inserting sensor; " + error);
			res.status(500).json(error);
		});
	});

	// Get sensors
	app.get("/api/v1/hvac/sensor", function(req, res) {
		console.log("sensors requested");
		console.log("params: " + JSON.stringify(req.query));
		Sensor.get(req.query).then(function(results) {
			console.log("sensors retrieved");
			res.json(results);
		}).catch(function(error) {
			console.log("sensor retrieval error: " + error);
			res.status(500).json(error);
		});
	});

	// Update sensor
	app.put("/api/v1/hvac/sensor/:id", function(req, res) {
		var sensorId = req.params.id;
		var body = _.pick(req.body, 'locationId', 'modelId', 'hostId', 'dataPin', 'enabled');
		console.log("updating sensor " + sensorId);
		console.log(body);
		Sensor.update(sensorId, body).then(function(result) {
			console.log("sensor " + sensorId + " updated");
			res.json(result);
		}).catch(function(error) {
			console.log("error updating sensor " + sensorId + "; " + error);
			res.status(500).json(error);
		});
	});

	// Delete sensor
	app.delete("/api/v1/hvac/sensor/:id", function(req, res) {
		var sensorId = req.params.id;
		console.log("sensor " + sensorId + " delete requested");
		Sensor.delete(sensorId).then(function(results) {
			console.log("sensor " + sensorId + " deleted");
			res.json(results);
		}).catch(function(error) {
			console.log("sensor delete error: " + error);
			res.status(500).json(error);
		});
	});
}