module.exports = function(app, System_Run, _, io) {
	// Insert system start
	app.post("/api/v1/hvac/system_run/start", function(req,res) {
		var body = _.pick(req.body, 'systemId');
		console.log("inserting system start");
		console.log(body);
		System_Run.start(body).then(function(result) {
			console.log("inserted system start");
			res.status(201).json(result);
		}).catch(function(error) {
			console.log("error inserting system start; " + error);
			res.status(500).json(error);
		});
	});

	// Insert system stop
	app.post("/api/v1/hvac/system_run/stop", function(req,res) {
		var body = _.pick(req.body, 'systemId');
		console.log("inserting system stop");
		console.log(body);
		System_Run.stop(body).then(function(result) {
			console.log("inserted system stop");
			res.status(200).json(result);
		}).catch(function(error) {
			console.log("error inserting system stop; " + error);
			res.status(500).json(error);
		});
	});

	// Get system runs
	app.get("/api/v1/hvac/system_run", function(req, res) {
		console.log("system runs requested");
		console.log("params: " + JSON.stringify(req.query));
		System_Run.get(req.query).then(function(results) {
			console.log("system runs retrieved");
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving system runs; " + error);
			res.status(500).json(error);
		});
	});

	// Get line chart data
	app.get("/api/v1/hvac/system_run/chart", function(req, res) {
		console.log("system run chart data requested");
		console.log("params: " + JSON.stringify(req.query));
		var data = _.pick(req.query, 'systemId', 'startTime', 'endTime');
		System_Run.chartData(data).then(function(results){
			console.log("system run chart data retrieved");
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving system run chart data; " + error);
			res.status(500).json(error);
		});
	});

	// Get plot band data
	app.get("/api/v1/hvac/system_run/plotBands", function(req, res) {
		console.log("system run plot band data requested");
		console.log("params: " + JSON.stringify(req.query));
		var data = _.pick(req.query, 'locations', 'startTime', 'endTime');
		System_Run.plotBands(data).then(function(results){
			console.log("system run plot band data retrieved");
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving system run plot band data; " + error);
			res.status(500).json(error);
		});
	});
}