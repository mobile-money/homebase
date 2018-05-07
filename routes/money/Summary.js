module.exports = function(app, Summary, _) {
	// Get all Summaries
	app.get("/api/v1/money/summaries", function(req, res) {
		console.log("all summaries requested");
		Summary.getAll()
		.then(
			function(results) {
				if (results.length > 0) {
					console.log("all summaries retrieved");
					res.json(results);
				} else {
					console.log("no summaries found");
					res.status(404).send();
				}
			}
		)
		.catch(
			function(error) {
				console.log("all summaries retrieval error: "+error);
				res.status(500).send();
			}
		);
	});

	// Get all summaries by Account ID
	app.get("/api/v1/money/summaries/:id", function(req, res) {
		console.log("summaries requested");
		Summary.getByAccountId(Number(req.params.id))
		.then(
			function(results) {
				if (results.length > 0) {
					console.log("summaries retrieved");
					res.json(results);
				} else {
					console.log("no summaries found");
					res.status(404).send();
				}
			}
		)
		.catch(
			function(error) {
				console.log("summaries retrieval error: "+error);
				res.status(500).send();
			}
		);
	});

	app.get("/api/v1/money/unique/summaries", function(req, res) {
		console.log("unique summaries requested");
		Summary.getAllUnique()
		.then(
			function(results) {
				console.log("unique summaries retrieved");
				res.json(results);
			}
		)
		.catch(
			function(error) {
				console.log("unique summaries retrieval error: "+error.error);
				res.status(500).send();
			}
		);
	});

    // Data Xfer from MySQL to DynamoDB
    // app.get("/api/v1/money/dataXfer/summaries",function(req,res) {
    //     Summary.dataXfer().then(function(result) {
    //         res.status(200).json(result);
    //     }).catch(function(err) {
    //         res.status(500).json(err);
    //     })
    // });
};