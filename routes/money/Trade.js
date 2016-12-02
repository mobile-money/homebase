module.exports = function(app, Trade, _, io) {
	// Get all transactions by Summary ID
	// app.get("/api/v1/trade/:id", function(req, res) {
		// console.log("transactions requested");
		// Transaction.getBySummaryId(Number(req.params.id))
		// .then(
		// 	function(results) {
		// 		if (results.length > 0) {
		// 			console.log("transactions retrieved");
		// 			res.json(results);
		// 		} else {
		// 			console.log("no transactions found");
		// 			res.status(404).send();
		// 		}
		// 	}
		// )
		// .catch(
		// 	function(error) {
		// 		console.log("transactions retrieval error: "+error);
		// 		res.status(500).send();
		// 	}
		// );
	// });

	// Insert trade
	app.post("/api/v1/money/trades", function(req, res) {
		console.log("trade add requested");
		var body = _.pick(req.body, 'account', 'tDate', 'ticker', 'description', 'quantity', 'price');
		// console.log(body);
		Trade.add(body)
		.then(
			function(obj) {
				console.log("trade added");
				io.emit("tradeAdded", {trade: obj.newTrade.id, position: obj.position.id});
				res.status(201).send(obj.newTrade);
			}
		)
		.catch(
			function(error) {
				console.log("add trade error: "+JSON.stringify(error));
				if (error.code === 1) {
					res.status(404).send();
				} else if (error.code === 2) {
					res.status(400).send();
				} else if (error.code === 0) {
					res.status(400).send();
				} else {
					res.status(500).send();
				}
			}
		);
	});

	// Update transaction by ID
	// app.put("/api/v1/transactions/:id", function(req, res) {
	// 	console.log("modify transaction requested");
	// 	var body = _.pick(req.body, 'payee', 'description', 'check', 'category');
	// 	body.id = req.params.id;
	// 	Transaction.update(body)
	// 	.then(
	// 		function(result) {
	// 			console.log("transaction modified");
	// 			io.emit("transactionChanged", result.id);
	// 			res.status(200).send();
	// 		}
	// 		,function() {
	// 			console.log("transaction not found");
	// 			res.status(404).send();
	// 		}
	// 	)
	// 	.catch(
	// 		function(error) {
	// 			console.log("transaction modification error: "+error);
	// 			res.status(500).send();
	// 		}
	// 	);
	// });

	// Delete transaction by ID
	// app.delete("/api/v1/transactions/:id", function(req, res) {
		// console.log("delete transaction requested");
		// Transaction.delete(req.params.id)
		// .then(
		// 	function() {
		// 		console.log("transaction deleted");
		// 		io.emit("transactionDeleted", req.params.id);
		// 		res.status(204).send();
		// 	}
		// 	,function() {
		// 		console.log("transaction not found");
		// 		res.status(404).send();
		// 	}
		// )
		// .catch(
		// 	function(error) {
		// 		console.log("transaction deletion error: "+error);
		// 		res.status(500).send();
		// 	}
		// );
	// });
}