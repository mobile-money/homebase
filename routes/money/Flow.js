module.exports = function(app, Transaction) {
	// Get all transactions by Account ID
	app.get("/api/v1/money/flows/:account/:start/:end/:id", function(req, res) {
		console.log("flows requested");
		Transaction.getFlow(req.user,req.params.account,req.params.start,req.params.end).then(function(results) {
			results.id = Number(req.params.id);
			res.json(results);
		}).catch(function(error) {
			console.log("flows retrieval error: "+error);
			if (error === "unauthorized") {
				res.status(401).send();
			} else {
				res.status(500).send();
			}
		});
	});
};