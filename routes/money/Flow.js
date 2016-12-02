module.exports = function(app, Transaction, _, io) {
	// Get all transactions by Account ID
	app.get("/api/v1/money/flows/:account/:start/:end/:id", function(req, res) {
		console.log("flows requested");
		// res.json({account: req.params.account, start: req.params.start, end: req.params.end});
		Transaction.getFlow(req.params.account,req.params.start,req.params.end)
		.then(
			function(results) {
				results.id = Number(req.params.id);
				res.json(results);
				// if (results.length > 0) {
				// 	console.log("flows retrieved");
				// 	res.json(results);
				// } else {
				// 	console.log("no flows found");
				// 	res.status(404).send();
				// }
			}
		)
		.catch(
			function(error) {
				console.log("flows retrieval error: "+error);
				res.status(500).send();
			}
		);
	});
}