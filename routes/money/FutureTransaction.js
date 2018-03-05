module.exports = function(app, FutureTransaction, _, io) {
	// Get all future transactions by Account ID
	app.get("/api/v1/money/futureTransactions/account/:id", function(req, res) {
		console.log("future transactions requested");
		FutureTransaction.getByAccountId(req.params.id)
		.then(
			function(results) {
				if (results.length > 0) {
					console.log("future transactions retrieved");
					res.json(results);
				} else {
					console.log("no future transactions found");
					res.status(204).send();
				}
			}
		)
		.catch(
			function(error) {
				console.log("future transactions retrieval error: "+error);
				res.status(500).send();
			}
		);
	});

	// Insert future transaction
	app.post("/api/v1/money/futureTransactions", function(req, res) {
		console.log("future transaction add requested");
		var body = _.pick(req.body, 'account', 'tDate', 'payee', 'description', 'check', 'amount', 'category', 'xfer', 'bill', 'multiCat');
		console.log(body);
		FutureTransaction.add(body)
		.then(
			function(obj) {
				console.log("future transaction added");
				io.emit("transactionAdded", "f_"+obj.id);
				res.status(201).send(obj);
			}
		)
		.catch(
			function(error) {
				console.log("add future transaction error: "+JSON.stringify(error));
				if (error.code === 1) {
					// account not found
					res.status(404).send();
				} else if (error.code === 4) {
					// create transaction error
					res.status(400).send();
				} else {
					res.status(500).send();
				}
			}
		);
	});

	// Update future transaction by ID
	app.put("/api/v1/money/futureTransactions/:id", function(req, res) {
		console.log("modify future transaction requested");
		var body = _.pick(req.body, 'tDate', 'payee', 'description', 'check', 'amount', 'category');
		body.id = req.params.id;
		FutureTransaction.update(body)
		.then(
			function(result) {
				console.log("future transaction modified");
				io.emit("transactionChanged", "f_"+result.id);
				res.status(200).send();
			}
			,function() {
				console.log("future transaction not found");
				res.status(404).send();
			}
		)
		.catch(
			function(error) {
				console.log("future transaction modification error: "+error);
				res.status(500).send();
			}
		);
	});

	// Delete future transaction by ID
	app.delete("/api/v1/money/futureTransactions/:id", function(req, res) {
		console.log("delete future transaction requested");
		FutureTransaction.delete(req.params.id)
		.then(
			function() {
				console.log("future transaction deleted");
				io.emit("transactionDeleted", "f_"+req.params.id);
				res.status(204).send();
			}
			,function() {
				console.log("future transaction not found");
				res.status(404).send();
			}
		)
		.catch(
			function(error) {
				console.log("future transaction deletion error: "+error);
				res.status(500).send();
			}
		);
	});

	// Commit future transaction
	app.put("/api/v1/money/futureTransaction/commit/:id", function(req, res) {
		console.log("commit future transaction requested");
		var body = _.pick(req.body, 'pDate');
		body.id = req.params.id;
		FutureTransaction.commit(body).then(function(newTransaction) {
			console.log("future transaction committed");
			io.emit("transactionAdded", newTransaction.id);
			res.json(newTransaction);
		},function(error) {
			if (error.code === 1) {
				console.log("future transaction not found");
				res.status(404).send();
			} else if (error.code === 2) {
				console.log("future transaction not deleted");
				res.status(400).send();
			} else {
				console.log("future transaction commit error: "+JSON.stringify(error));
				res.status(500).send();
			}
		}).catch(function(error) {
			console.log("future transaction commit error: "+JSON.stringify(error));
			res.status(500).send();
		});
	});
	// app.get("/api/v1/money/futureTransaction/commit/:id", function(req, res) {
	// 	console.log("commit future transaction requested");
	// 	FutureTransaction.commit(req.params.id)
	// 	.then(
	// 		function(newTransaction) {
	// 			console.log("future transaction committed");
	// 			io.emit("transactionAdded", newTransaction.id);
	// 			res.json(newTransaction);
	// 		}
	// 		,function(error) {
	// 			if (error.code === 1) {
	// 				console.log("future transaction not found");
	// 				res.status(404).send();
	// 			} else if (error.code === 2) {
	// 				console.log("future transaction not deleted");
	// 				res.status(400).send();
	// 			} else {
	// 				console.log("future transaction commit error: "+JSON.stringify(error));
	// 				res.status(500).send();
	// 			}
	// 		}
	// 	)
	// 	.catch(
	// 		function(error) {
	// 			console.log("future transaction commit error: "+JSON.stringify(error));
	// 			res.status(500).send();
	// 		}
	// 	);
	// });
};