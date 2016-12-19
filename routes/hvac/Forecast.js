module.exports = function(app, Forecast, _, io) {
	// Update forecast
	app.post("/api/v1/hvac/forecast", function(req,res) {
		console.log("updating forecast");
		Forecast.update().then(function(results) {
			console.log("updated forecast");
			io.emit("newForecast");
			res.status(200).json(results);
		}).catch(function(error) {
			console.log("error updating forecast; " + error);
			res.status(500).json(error);
		});
	});

	// Get forecast
	app.get("/api/v1/hvac/forecast", function(req, res) {
		console.log("forecast requested");
		Forecast.get().then(function(results) {
			console.log("forecast retrieved");
			res.json(results);
		}).catch(function(error) {
			console.log("error retrieving forecast; " + error);
			res.status(500).json(error);
		});
	});
}