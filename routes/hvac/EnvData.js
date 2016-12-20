module.exports = function(app, EnvData, _, io) {
	// Insert environment data
	app.post("/api/v1/hvac/envData", function(req,res) {
		var body = _.pick(req.body, 'sensorId', 'temperature', 'humidity');
		console.log("inserting environment data");
		console.log(body);
		EnvData.insert(body).then(function(result) {
			console.log("inserted environment data");
			io.emit("newReading", result);
			res.status(201).json(result);
		}).catch(function(error) {
			console.log("error inserting environment data; " + error);
			res.status(500).json(error);
		});
	});

	// Get environment data
	app.get("/api/v1/hvac/envData", function(req, res) {
		console.log("environment data requested");
		console.log("params: " + JSON.stringify(req.query));
		EnvData.get(req.query).then(function(results) {
			console.log("environment data retrieved");
			res.setHeader("X-Count", results.length);
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving environment data; " + error);
			res.status(500).json(error);
		});
	});

	// Get line chart data
	app.get("/api/v1/hvac/envData/chart", function(req, res) {
		console.log("line chart data requested");
		console.log("params: " + JSON.stringify(req.query));
		var data = _.pick(req.query, 'locations', 'temperature', 'humidity', 'startTime', 'endTime');
		EnvData.lineChart(data).then(function(results){
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving line chart data; " + error);
			res.status(500).json(error);
		});
	});

	// Get last reading by LocationId
	app.get("/api/v1/hvac/envData/lastReading/:id", function(req, res) {
		var id = req.params.id
		console.log("last reading requested for LocationId " + id);
		EnvData.lastReading(id).then(function(result) {
			console.log("last reading retrieved for LocationId "+id);
			res.json(result);
		}).catch(function(error) {
			console.log("error retrieving last reading for LocationId "+id+"; " + error);
			res.status(500).json(error);
		});
	});

	// Check for recent updates
	app.get("/api/v1/hvac/envData/healthCheck", function(req, res) {
		console.log("performing sensor health check");
		EnvData.healthCheck(5).then(function(result) {
			console.log("result of health check: "+result);
			res.json(result);
		}).catch(function(error) {
			console.log("error running health check; "+error);
			res.status(500).json(error);
		});
	});
}