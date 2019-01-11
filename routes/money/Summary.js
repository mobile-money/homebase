module.exports = function(app, Summary, _) {
	// Get all Summaries
	app.get("/api/v1/money/summaries", function(req, res) {
		console.log("all summaries requested");
		Summary.getAll(req.user).then(function(results) {
			if (results.length > 0) {
				console.log("all summaries retrieved");
				res.json(results);
			} else {
				console.log("no summaries found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("all summaries retrieval error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	// Get all summaries by Account ID
	app.get("/api/v1/money/summaries/:id", function(req, res) {
		console.log("summaries requested");
		Summary.getByAccountId(req.user, Number(req.params.id)).then(
		function(results) {
			if (results.length > 0) {
				console.log("summaries retrieved");
				res.json(results);
			} else {
				console.log("no summaries found");
				res.status(404).send();
			}
		}).catch(function(error) {
			console.log("summaries retrieval error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});

	app.get("/api/v1/money/unique/summaries", function(req, res) {
		console.log("unique summaries requested");
		Summary.getAllUnique(req.user).then(function(results) {
			console.log("unique summaries retrieved");
			res.json(results);
		}).catch(function(error) {
			console.log("unique summaries retrieval error: "+error.error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});
};